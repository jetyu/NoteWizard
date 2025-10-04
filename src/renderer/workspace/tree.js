import * as vfs from './vfs.js';

// 跟踪展开的文件夹ID
let expandedFolders = new Set();

let handlers = {
  onSelect: null, // function(node)
  onContext: null, // function(node, event)
  onMove: null, // function(sourceId, targetNode)
  onInlineRenameCommit: null, // function(node, newName)
};

function setHandlers(h) {
  handlers = { ...handlers, ...(h || {}) };
}

function buildTreeDom(parentId) {
  const ul = document.createElement('ul');
  ul.className = 'tree-level';
  const children = vfs.listChildren(parentId);
  children.forEach((node) => {
    const li = document.createElement('li');
    li.className = 'tree-item ' + (node.type === 'folder' ? 'folder' : 'file');
    li.dataset.nodeId = node.id;

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.draggable = true;
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = node.type === 'folder' ? '📓' : '📄';
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.name;

    row.appendChild(icon);
    row.appendChild(label);
    li.appendChild(row);

    row.addEventListener('click', () => {
      document.querySelectorAll('.tree-row.active').forEach(x => x.classList.remove('active'));
      row.classList.add('active');
      if (handlers.onSelect) handlers.onSelect(node);
      if (node.type === 'folder') {
        const wasExpanded = li.classList.contains('expanded');
        li.classList.toggle('expanded');
        const existing = li.querySelector(':scope > ul.tree-level');
        
        if (li.classList.contains('expanded')) {
          if (existing) existing.remove();
          li.appendChild(buildTreeDom(node.id));
          if (!wasExpanded) {
            expandedFolders.add(node.id);
          }
        } else {
          if (existing) existing.remove();
          expandedFolders.delete(node.id);
        }
      }
    });

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (handlers.onContext) handlers.onContext(node, e);
    });

    // 拖拽源
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    // 仅允许拖放到文件夹
    if (node.type === 'folder') {
      row.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId || sourceId === node.id) return;
        if (handlers.onMove) handlers.onMove(sourceId, node);
      });
    }

    if (node.type === 'folder') {
      li.classList.add('collapsible');
      // 默认展开所有文件夹
      li.classList.add('expanded');
      expandedFolders.add(node.id);
      // 递归渲染子节点
      li.appendChild(buildTreeDom(node.id));
    }

    ul.appendChild(li);
  });
  return ul;
}

// 获取当前展开的文件夹ID
function getExpandedFolders() {
  const folders = new Set();
  document.querySelectorAll('.tree-item.folder.expanded').forEach(el => {
    folders.add(el.dataset.nodeId);
  });
  return folders;
}

function renderTree() {
  const container = document.getElementById('tree');
  if (!container) return;
  
  // 保存当前展开的文件夹状态
  if (expandedFolders.size === 0) {
    // 只在第一次渲染时从DOM获取
    expandedFolders = getExpandedFolders();
  }
  
  container.innerHTML = '';
  // 根是 parentId === null 的集合，渲染为一级
  const roots = vfs.listChildren(null);
  const rootUl = document.createElement('ul');
  rootUl.className = 'tree-root';
  roots.forEach((rootNode) => {
    const li = document.createElement('li');
    li.className = 'tree-item ' + (rootNode.type === 'folder' ? 'folder' : 'file');
    li.dataset.nodeId = rootNode.id;
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.draggable = true;
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = rootNode.type === 'folder' ? '📓' : '📄';
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = rootNode.name;

    row.appendChild(icon);
    row.appendChild(label);
    li.appendChild(row);

    row.addEventListener('click', () => {
      // 取消任何正在进行的重命名
      cancelCurrentRename();
      
      document.querySelectorAll('.tree-row.active').forEach(x => x.classList.remove('active'));
      row.classList.add('active');
      if (handlers.onSelect) handlers.onSelect(rootNode);
      if (rootNode.type === 'folder') {
        const wasExpanded = li.classList.contains('expanded');
        li.classList.toggle('expanded');
        const existing = li.querySelector(':scope > ul.tree-level');
        
        if (li.classList.contains('expanded')) {
          if (existing) existing.remove();
          li.appendChild(buildTreeDom(rootNode.id));
          if (!wasExpanded) {
            expandedFolders.add(rootNode.id);
          }
        } else {
          if (existing) existing.remove();
          expandedFolders.delete(rootNode.id);
        }
      }
    });

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (handlers.onContext) handlers.onContext(rootNode, e);
    });

    // 根节点拖拽：源始终可拖，目标仅当为文件夹时允许
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', rootNode.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    if (rootNode.type === 'folder') {
      row.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId || sourceId === rootNode.id) return;
        if (handlers.onMove) handlers.onMove(sourceId, rootNode);
      });
      li.classList.add('collapsible');
      // 默认展开根文件夹
      li.classList.add('expanded');
      expandedFolders.add(rootNode.id);
      // 递归渲染子节点
      li.appendChild(buildTreeDom(rootNode.id));
    }

    rootUl.appendChild(li);
  });
  container.appendChild(rootUl);
}

// 保存当前正在重命名的节点ID和取消函数
let currentRename = {
  nodeId: null,
  cancel: null
};

// 取消当前正在进行的重命名操作
function cancelCurrentRename() {
  if (currentRename.cancel) {
    currentRename.cancel();
    currentRename = { nodeId: null, cancel: null };
  }
}

function startInlineRename(nodeId) {
  // 取消任何正在进行的重命名
  if (currentRename.nodeId && currentRename.nodeId !== nodeId) {
    cancelCurrentRename();
  }

  const li = document.querySelector(`.tree-item[data-node-id="${nodeId}"]`);
  if (!li) return;
  const label = li.querySelector('.tree-label');
  if (!label) return;
  const node = vfs.getNodeById(nodeId);
  if (!node) return;

  // 防重复
  if (li.querySelector('input.tree-rename')) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tree-rename';
  input.value = node.name || '';
  input.style.width = Math.max(120, label.offsetWidth || 120) + 'px';

  // 替换 label
  label.style.display = 'none';
  label.after(input);
  
  // 确保输入框可交互
  input.style.position = 'relative';
  input.style.zIndex = '1000';
  input.focus();
  input.select();
  input.focus();
  input.select();

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = (input.value || '').trim();
    input.removeEventListener('keydown', onKey);
    input.removeEventListener('blur', onBlur);
    input.parentNode && input.parentNode.removeChild(input);
    label.style.display = '';
    if (newName && newName !== node.name) {
      if (handlers.onInlineRenameCommit) handlers.onInlineRenameCommit(node, newName);
    }
  };
  const cancel = () => {
    if (committed) return;
    committed = true;
    input.removeEventListener('keydown', onKey);
    input.removeEventListener('blur', onBlur);
    input.parentNode && input.parentNode.removeChild(input);
    label.style.display = '';
    // 清除当前重命名状态
    if (currentRename.nodeId === nodeId) {
      currentRename = { nodeId: null, cancel: null };
    }
  };
  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };
  const onBlur = () => commit();
  // 保存当前重命名状态
  currentRename = {
    nodeId: nodeId,
    cancel: cancel
  };
  
  input.addEventListener('keydown', onKey);
  input.addEventListener('blur', onBlur);
}

export {
  setHandlers,
  renderTree,
  startInlineRename,
  buildTreeDom,
};
