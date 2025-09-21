const fs = require('fs');
const path = require('path');
const os = require('os');
const { ipcRenderer } = require('electron');
const state = require('./state');
const { renderPreview } = require('./preview');
const vfs = require('./vfs');
const tree = require('./tree');


/**
 * 获取默认的保存目录路径
 * 根据操作系统返回对应的应用数据目录
 * @returns {string} 返回配置文件的完整路径
 */
function getDefaultSaveDir() {
  let baseDir = '';
  const appName = 'NoteWizard'; // 统一应用名称
  if (process.platform === 'win32') {
    // 使用用户文档目录下的 NoteWizard\Database 作为默认存储位置
    baseDir = path.join(os.homedir(), 'Documents', appName, 'Database');
  } else if (process.platform === 'darwin') {
    baseDir = path.join(os.homedir() || '', 'Library', 'Application Support', appName, 'Database');
  } else {
    baseDir = path.join(os.homedir() || '', `.${appName}`, 'Database');
  }
  
  return baseDir;
}

/**
 * 更新状态栏消息
 * @param {string} message - 要显示的状态消息
 */
function updateStatus(message) {
  const statusElem = document.getElementById('status');
  if (statusElem) statusElem.textContent = message;
}

/**
 * 显示文件属性对话框
 * @param {string} filePath - 文件路径
 */
function showFileProperties(filePath) {
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size).toFixed(2);
    const modifiedTime = new Date(stats.mtime).toLocaleString();

    const props = `
      位置: ${path.dirname(filePath)}
      大小: ${sizeInMB} KB
      修改时间: ${modifiedTime}
    `;

    alert(`文件属性:\n${props}`);
  } catch (error) {
    const errorMessage = `无法获取文件属性: ${error.message}\n路径: ${filePath}`;
    alert(errorMessage);
  }
}


/**
 * 显示视图的上下文菜单
 * @param {Object} node - 当前选中的节点
 * @param {Event} e - 触发菜单的鼠标事件
 */
function showContextMenu(node, e) {
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.style.zIndex = '1000';

  const isRoot = !node || node.id === 'root';
  const isFolder = !isRoot && node.type === 'folder';
  const isFile = !isRoot && node.type === 'file';

  let menuHTML = [];

  // 1. 工作区（空白区域）
  if (isRoot) {
    menuHTML.push(
      '<div class="menu-item" data-action="new-note">新建笔记</div>',
      '<div class="menu-item" data-action="new-notebook">新建笔记本</div>'
    );
  }
  // 2. 笔记文件
  else if (isFile) {
    menuHTML.push(
      '<div class="menu-item" data-action="open">打开</div>',
      '<div class="menu-item" data-action="rename">重命名</div>',
      '<div class="menu-item" data-action="delete">删除</div>',
      '<div class="menu-item" data-action="showInFolder">打开文件所在位置</div>',
      '<div class="menu-item" data-action="properties">属性</div>'
    );
  }
  // 3. 笔记本文件夹
  else if (isFolder) {
    menuHTML.push(
      '<div class="menu-item" data-action="new-note">新建笔记</div>',
      '<div class="menu-item" data-action="new-notebook">新建笔记本</div>',
      '<div class="menu-item" data-action="rename">重命名</div>',
      '<div class="menu-item" data-action="delete">删除</div>'
    );
  }

  menu.innerHTML = menuHTML.join('\n');
  document.body.appendChild(menu);

  const close = () => { if (menu.parentNode) document.body.removeChild(menu); document.removeEventListener('click', onDocClick); };
  const onDocClick = (ev) => { if (!menu.contains(ev.target)) close(); };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);

  menu.addEventListener('click', (ev) => {
    const act = ev.target && ev.target.dataset && ev.target.dataset.action;
    if (!act) return;
    ev.stopPropagation();
    close();

    try {
      // 处理文件相关操作
      if (['open', 'showInFolder', 'properties'].includes(act) && node) {
        try {
          // 获取文件路径
          let filePath;
          if (node.contentId) {
            const ext = node.name ? path.extname(node.name) : '.md'; // 默认使用 .md 扩展名
            const fileName = node.contentId + (node.contentId.endsWith(ext) ? '' : ext);
            filePath = path.join(getDefaultSaveDir(), 'objects', fileName);
          }
          // 确保文件路径有扩展名
          if (filePath && !path.extname(filePath) && node.name) {
            const ext = path.extname(node.name) || '.md';
            filePath += ext;
          }
          
          if (!filePath) {
            updateStatus('无法获取文件路径');
            return;
          }
          switch (act) {
            case 'open':
              require('electron').shell.openPath(filePath).catch(console.error);
              break;
            case 'showInFolder':
              require('electron').shell.showItemInFolder(filePath);
              break;
            case 'properties':
              showFileProperties(filePath);
              break;
          }
        } catch (err) {
          updateStatus('操作失败: ' + err.message);
        }
        return;
      }

      // 处理树节点操作
      let parentId = null;
      if (node) parentId = node.type === 'folder' ? node.id : node.parentId;

      if (act === 'new-note') {
        const n = vfs.createFile(parentId, '新建笔记');
        tree.renderTree();
        selectNode(n);
      } else if (act === 'new-notebook') {
        const targetParentId = node && node.type === 'folder' ? node.id : null;
        const folder = vfs.createFolder(targetParentId, '新建笔记本');
        tree.renderTree();
      } else if (act === 'rename') {
        setTimeout(() => tree.startInlineRename(node.id), 0);
      } else if (act === 'delete') {
        if (confirm(`确定删除"${node.name}"${node.type === 'folder' ? '（将删除其子项）' : ''}？`)) {
          vfs.deleteNode(node.id);
          if (state.currentNodeId === node.id) {
            state.currentNodeId = null;
            if (state.editor) state.editor.setValue('');
          }
          // 刷新文件列表
          if (typeof tree.renderTree === 'function') {
            tree.renderTree();
          }
          tree.renderTree();
          updateStatus('已删除');
        }
      }
    } catch (err) {
    }
  });
}

/**
 * 选择并加载节点内容
 * @param {Object} node - 要选择的节点对象
 * 处理文件节点的内容加载和文件夹节点的状态更新
 */
function selectNode(node) {
  if (state.currentNodeId && state.editor) {
    const prevNode = vfs.getNodeById(state.currentNodeId);
    if (prevNode && prevNode.type === 'file') {
      const currentContent = state.editor.getValue();
      state.fileContents.set(prevNode.id, currentContent);
    }
  }

  state.currentNodeId = node ? node.id : null;
  if (!node) return;
  if (node.type === 'folder') {
    if (state.editor) state.editor.setValue('');
    updateStatus(`打开文件夹: ${node.name}`);
    renderPreview();
    return;
  }
  // file 节点
  let content = state.fileContents.get(node.id);
  if (content == null) {
    try {
      content = node.contentId ? vfs.readContent(node.contentId) : '';
    } catch (e) {
      content = '';
    }
  }
  if (state.editor) {
    state.editor.setValue(content || '');
    state.fileContents.set(node.id, content || '');
    updateStatus(`加载文件: ${node.name}`);
  }
  renderPreview();
}

/**
 * 处理文件操作
 * @param {string} action - 要执行的操作类型 (rename/delete)
 * @param {HTMLElement} fileItem - 关联的文件元素
 */
function handleFileAction(action, fileItem) {
  const oldName = fileItem.textContent;
  const oldPath = fileItem.dataset.filePath;
  const dir = path.dirname(oldPath || getDefaultSaveDir());

  switch (action) {
    case 'rename': {
      const input = prompt('请输入新文件名:', oldName);
      if (!input || input === oldName) return;
      const finalName = input.toLowerCase().endsWith('.md') ? input : input + '.md';
      const newPath = path.join(dir, finalName);
      if (fs.existsSync(newPath)) {
        alert('已存在同名文件，请换一个名称。');
        return;
      }
      try {
        if (oldPath && fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        } else {
          const content = state.fileContents.get(oldName) || (state.editor && state.editor.getValue && state.editor.getValue()) || '';
          fs.writeFileSync(newPath, content, 'utf-8');
        }
        fileItem.textContent = finalName;
        fileItem.dataset.filePath = newPath;
        if (state.fileContents.has(oldName)) {
          const cache = state.fileContents.get(oldName);
          state.fileContents.delete(oldName);
          state.fileContents.set(finalName, cache);
        }
        if (state.currentFileItem === fileItem) state.currentFilePath = newPath;
        updateStatus(`文件重命名为: ${finalName}`);
      } catch (e) {
        alert('重命名失败，请检查权限或文件是否被占用。');
      }
      break;
    }
    case 'delete': {
      if (!confirm(`确定要删除文件 "${oldName}" 吗？此操作不可恢复。`)) return;
      try {
        if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) {
        alert('删除失败，请检查权限或文件是否被占用。');
        return;
      }
      if (state.fileContents.has(oldName)) state.fileContents.delete(oldName);
      const list = document.getElementById('file-list');
      let nextToSelect = null;
      if (list) nextToSelect = fileItem.nextElementSibling || fileItem.previousElementSibling;
      const wasActive = fileItem.classList.contains('active');
      fileItem.remove();
      if (wasActive) {
        if (nextToSelect) {
          selectFile(nextToSelect);
        } else {
          if (state.editor) state.editor.setValue('');
          state.currentFileItem = null;
          state.currentFilePath = null;
          updateStatus('文件已删除');
        }
      } else {
        updateStatus('文件已删除');
      }
      break;
    }
    default:
      break;
  }
}

/**
 * 初始化文件工作区
 * 设置事件监听器、初始化树形视图和全局快捷键
 * 处理新建文件/文件夹的上下文菜单
 */
function initializeFileWorkspace() {
  // 添加文件打开事件监听
  ipcRenderer.on('file-opened', (event, { content, filePath }) => {
      // 获取文件名（带扩展名）
      const fileNameWithExt = path.basename(filePath);
      // 获取不带扩展名的文件名
      const fileName = path.basename(filePath, path.extname(filePath));
      // 使用当前选中的节点作为父节点，如果没有则使用根目录
      const parentId = state.currentNodeId || null;
      // 创建新节点，传入带扩展名的文件名
      const node = vfs.createFile(parentId, fileNameWithExt, content);
      // 重新渲染树
      tree.renderTree();
      // 选择新创建的节点
      selectNode(node);
      updateStatus(`已打开导入文件: ${fileName}`);
  });

  // 新建按钮
  const newFileBtn = document.getElementById('new-file-btn');
  // 搜索框
  const fileSearch = document.getElementById('file-search');
  // 树形视图
  const treeContainer = document.getElementById('tree');

  if (!newFileBtn || !fileSearch || !treeContainer) {
    setTimeout(initializeFileWorkspace, 100);
    return;
  }

  try {
    const { root } = vfs.initWorkspace();
    updateStatus(`工作区: ${root}`);

    tree.setHandlers({
      onSelect: (node) => selectNode(node),
      onContext: (node, ev) => showContextMenu(node, ev),
      onMove: (sourceId, targetNode) => {
        try {
          const src = vfs.getNodeById(sourceId);
          if (!src || !targetNode || targetNode.type !== 'folder') return;
          if (sourceId === targetNode.id) return;
          // 防止将父节点拖入其子节点
          let p = targetNode.parentId;
          while (p) { if (p === sourceId) return; const pn = vfs.getNodeById(p); p = pn ? pn.parentId : null; }
          vfs.moveNode(sourceId, targetNode.id, Date.now());
          tree.renderTree();
          updateStatus(`已移动到: ${targetNode.name}`);
        } catch (err) { }
      },
      onInlineRenameCommit: (node, newName) => {
        try {
          vfs.renameNode(node.id, newName);
          const keep = vfs.getNodeById(node.id);
          tree.renderTree();
          if (keep) selectNode(keep);
          updateStatus('已重命名');
        } catch (err) { }
      },
    });
    tree.renderTree();
  } catch (e) { }

  newFileBtn.addEventListener('click', (e) => {
    // 弹出新建菜单：笔记 / 笔记本
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    const rect = newFileBtn.getBoundingClientRect();
    menu.style.left = (rect.left) + 'px';
    menu.style.top = (rect.bottom + 6) + 'px';
    menu.style.zIndex = '1000';
    menu.innerHTML = `
      <div class="menu-item" data-action="new-note">新建笔记</div>
      <div class="menu-item" data-action="new-notebook">新建笔记本</div>
    `;
    document.body.appendChild(menu);

    const close = () => { if (menu.parentNode) document.body.removeChild(menu); document.removeEventListener('click', onDocClick); };
    const onDocClick = (ev) => { if (!menu.contains(ev.target)) close(); };
    setTimeout(() => document.addEventListener('click', onDocClick), 0);

    menu.addEventListener('click', (ev) => {
      const act = ev.target && ev.target.dataset && ev.target.dataset.action;
      if (!act) return;
      ev.stopPropagation();
      close();
      try {
        if (act === 'new-note') {
          // 在根目录下创建新笔记
          const node = vfs.createFile(null, '新建笔记');
          // 重新渲染树
          tree.renderTree();
          // 选择新创建的笔记
          setTimeout(() => {
            selectNode(node);
            const selected = document.querySelector('.tree-row.active');
            if (selected) {
              selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);
          updateStatus('已在根目录创建新笔记');
        } else if (act === 'new-notebook') {
          // 在根目录下创建新笔记本
          const folder = vfs.createFolder(null, '新建笔记本');
          tree.renderTree();
          updateStatus('已在根目录创建新笔记本');
        }
      } catch (err) {
      }
    });
  });

  // 全局快捷键：F2 重命名 / Delete 删除
  if (!state._kbBound) {
    state._kbBound = true;
    window.addEventListener('keydown', (ev) => {
      if (!state.currentNodeId) return;
      const node = vfs.getNodeById(state.currentNodeId);
      if (!node) return;
      if (ev.key === 'F2') {
        ev.preventDefault();
        setTimeout(() => tree.startInlineRename(node.id), 0);
      } else if (ev.key === 'Delete') {
        ev.preventDefault();
        if (confirm(`确定删除"${node.name}"${node.type === 'folder' ? '（将删除其子项）' : ''}？`)) {
          vfs.deleteNode(node.id);
          if (state.currentNodeId === node.id) {
            state.currentNodeId = null;
            if (state.editor) state.editor.setValue('');
          }
          // 刷新文件列表
          if (typeof tree.renderTree === 'function') {
            tree.renderTree();
          }
          tree.renderTree();
          updateStatus('已删除');
        }
      }
    });
  }

}

/**
 * 设置编辑器事件监听
 * 处理编辑器内容变更和自动保存功能
 */
function setupEditorEvents() {
  if (state.editor) {
    state.editor.on('change', () => {
      renderPreview();
      const nodeId = state.currentNodeId;
      if (!nodeId) return;
      const node = vfs.getNodeById(nodeId);
      if (!node || node.type !== 'file') return;
      const content = state.editor.getValue();
      state.fileContents.set(nodeId, content);
      if (state.autoSaveTimer) clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = setTimeout(() => {
        try {
          if (node.contentId) {
            vfs.writeContent(node.contentId, state.editor.getValue());
            updateStatus(`已自动保存: ${node.name}`);
          }
        } catch (e) {
          updateStatus('自动保存失败，请检查磁盘权限');
        }
      }, 800);
    });
  } else {
    setTimeout(setupEditorEvents, 100);
  }
}

/**
 * 文件操作相关的公共接口
 */
module.exports = {
  getDefaultSaveDir,
  updateStatus,
  showFileProperties,
  handleFileAction,
  initializeFileWorkspace,
  setupEditorEvents,
  selectFile: selectNode,
};
