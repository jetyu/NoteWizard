import state from '../state.js';
import { renderPreview } from '../preview/preview.js';
import * as vfs from './vfs.js';
import * as tree from './tree.js';
import * as outline from '../outline.js';
import { t } from '../i18n.js';

const electronAPI = window.electronAPI;

if (!electronAPI) {
  throw new Error('electronAPI 未初始化，无法在渲染进程访问受信任的 Node API');
}

function findFirstFileNode(parentId) {
  const children = vfs.listChildren(parentId);
  for (const child of children) {
    if (child.type === 'file') {
      return child;
    }
    if (child.type === 'folder') {
      const result = findFirstFileNode(child.id);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function selectFirstAvailableNote() {
  if (state.currentNodeId) return;
  const firstFileNode = findFirstFileNode(null);
  if (!firstFileNode) return;
  setTimeout(() => {
    const row = document.querySelector(`.tree-item[data-node-id="${firstFileNode.id}"] .tree-row`);
    if (row) {
      row.click();
    } else {
      selectNode(firstFileNode);
    }
  }, 0);
}

const {
  fs: electronFs,
  path: electronPath,
  os: electronOs,
  ipcRenderer,
  shell: electronShell,
} = electronAPI;


/**
 * 获取默认的保存目录路径
 * 根据操作系统返回对应的应用数据目录
 * @returns {string} 返回配置文件的完整路径
 */
function getDefaultSaveDir() {
  const appName = 'NoteWizard';
  const platform = electronOs.platform();
  const homeDir = electronOs.homedir() || '';

  if (platform === 'win32') {
    return electronPath.join(homeDir, 'Documents', appName, 'Database');
  }
  if (platform === 'darwin') {
    return electronPath.join(
      homeDir,
      'Library',
      'Application Support',
      appName,
      'Database',
    );
  }

  return electronPath.join(homeDir, `.${appName}`, 'Database');
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
    if (!electronFs.existsSync(filePath)) {
      throw new Error(`${t('file.notExist')}: ${filePath}`);
    }

    const stats = electronFs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    const modifiedTime = new Date(stats.mtime).toLocaleString();

    const props = `
      ${t('property.location')}: ${electronPath.dirname(filePath)}
      ${t('property.size')}: ${sizeInKB} KB
      ${t('property.modifiedTime')}: ${modifiedTime}
    `;

    alert(`${t('dialog.fileProperties')}:\n${props}`);
  } catch (error) {
    const errorMessage = `${t('dialog.cannotGetProperties')}: ${error.message}\n${t('dialog.path')}: ${filePath}`;
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
      `<div class="menu-item" data-action="new-note">${t('contextMenu.newNote')}</div>`,
      `<div class="menu-item" data-action="new-notebook">${t('contextMenu.newNotebook')}</div>`
    );
  }
  // 2. 笔记文件
  else if (isFile) {
    menuHTML.push(
      `<div class="menu-item" data-action="open">${t('contextMenu.open')}</div>`,
      `<div class="menu-item" data-action="rename">${t('contextMenu.rename')}</div>`,
      `<div class="menu-item" data-action="delete">${t('contextMenu.delete')}</div>`,
      `<div class="menu-item" data-action="showInFolder">${t('contextMenu.showInFolder')}</div>`,
      `<div class="menu-item" data-action="properties">${t('contextMenu.properties')}</div>`
    );
  }
  // 3. 笔记本文件夹
  else if (isFolder) {
    menuHTML.push(
      `<div class="menu-item" data-action="new-note">${t('contextMenu.newNote')}</div>`,
      `<div class="menu-item" data-action="new-notebook">${t('contextMenu.newNotebook')}</div>`,
      `<div class="menu-item" data-action="rename">${t('contextMenu.rename')}</div>`,
      `<div class="menu-item" data-action="delete">${t('contextMenu.delete')}</div>`
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
            const ext = node.name ? electronPath.extname(node.name) : '.md'; // 默认使用 .md 扩展名
            const fileName = node.contentId + (node.contentId.endsWith(ext) ? '' : ext);
            filePath = electronPath.join(getDefaultSaveDir(), 'objects', fileName);
          }
          // 确保文件路径有扩展名
          if (filePath && !electronPath.extname(filePath) && node.name) {
            const ext = electronPath.extname(node.name) || '.md';
            filePath += ext;
          }
          
          if (!filePath) {
            updateStatus(t('file.cannotGetPath'));
            return;
          }
          switch (act) {
            case 'open':
              electronShell.openPath(filePath).catch(console.error);
              break;
            case 'showInFolder':
              electronShell.showItemInFolder(filePath);
              break;
            case 'properties':
              showFileProperties(filePath);
              break;
          }
        } catch (err) {
          updateStatus(t('file.operationFailed') + ': ' + err.message);
        }
        return;
      }

      // 处理树节点操作
      let parentId = null;
      if (node) parentId = node.type === 'folder' ? node.id : node.parentId;

      if (act === 'new-note') {
        const n = vfs.createFile(parentId, t('default.newNote'));
        tree.renderTree();
        selectNode(n);
      } else if (act === 'new-notebook') {
        const targetParentId = node && node.type === 'folder' ? node.id : null;
        const folder = vfs.createFolder(targetParentId, t('default.newNotebook'));
        tree.renderTree();
      } else if (act === 'rename') {
        setTimeout(() => tree.startInlineRename(node.id), 0);
      } else if (act === 'delete' && node) {
        const displayName = node.name || t('default.thisItem');
        if (!confirm(t('dialog.deleteConfirm').replace('{name}', displayName))) {
          return;
        }

        try {
          const parentNode = node.parentId ? vfs.getNodeById(node.parentId) : null;
          vfs.deleteNode(node.id);
          ipcRenderer?.send('trash-updated');
          tree.renderTree();

          if (state.currentNodeId === node.id) {
            state.currentNodeId = null;
            if (state.editor) {
              state.editor.setValue('');
            }
          }

          if (parentNode) {
            selectNode(parentNode);
          } else {
            renderPreview();
          }

          updateStatus(t('file.movedToTrash'));
        } catch (err) {
          console.error('删除节点失败:', err);
          updateStatus(t('file.deleteFailed'));
        }

        return;
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
    updateStatus(`${t('file.openedFolder')}: ${node.name}`);
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
    updateStatus(`${t('file.loadedFile')}: ${node.name}`);
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
  const dir = electronPath.dirname(oldPath || getDefaultSaveDir());

  switch (action) {
    case 'rename': {
      const input = prompt(t('dialog.renamePrompt'), oldName);
      if (!input || input === oldName) return;
      const finalName = input.toLowerCase().endsWith('.md') ? input : input + '.md';
      const newPath = electronPath.join(dir, finalName);
      if (electronFs.existsSync(newPath)) {
        alert(t('file.fileExists'));
        return;
      }
      try {
        if (oldPath && electronFs.existsSync(oldPath)) {
          electronFs.renameSync(oldPath, newPath);
        } else {
          const content = state.fileContents.get(oldName) || (state.editor && state.editor.getValue && state.editor.getValue()) || '';
          electronFs.writeFileSync(newPath, content, 'utf-8');
        }
        fileItem.textContent = finalName;
        fileItem.dataset.filePath = newPath;
        if (state.fileContents.has(oldName)) {
          const cache = state.fileContents.get(oldName);
          state.fileContents.delete(oldName);
          state.fileContents.set(finalName, cache);
        }
        if (state.currentFileItem === fileItem) state.currentFilePath = newPath;
        updateStatus(`${t('file.renamed')}: ${finalName}`);
      } catch (e) {
        alert(t('file.renameFailed'));
      }
      break;
    }
    case 'delete': {
      if (!confirm(t('dialog.deleteFileConfirm').replace('{name}', oldName))) return;
      try {
        if (oldPath && electronFs.existsSync(oldPath)) electronFs.unlinkSync(oldPath);
      } catch (e) {
        alert(t('file.deleteFailed2'));
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
          updateStatus(t('file.deleted'));
        }
      } else {
        updateStatus(t('file.deleted'));
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
async function initializeFileWorkspace() {
  let newFileBtn = document.getElementById('new-file-btn');
  let fileSearch = document.getElementById('file-search');
  let treeContainer = document.getElementById('tree');

  while (!newFileBtn || !fileSearch || !treeContainer) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    newFileBtn = document.getElementById('new-file-btn');
    fileSearch = document.getElementById('file-search');
    treeContainer = document.getElementById('tree');
  }

  ipcRenderer.removeAllListeners('file-opened');
  ipcRenderer.on('file-opened', (event, { content, filePath }) => {
    const fileNameWithExt = electronPath.basename(filePath);
    const fileName = electronPath.basename(filePath, electronPath.extname(filePath));
    
    // 确定父节点：如果当前选中的是文件，使用其父节点；如果是文件夹，使用该文件夹
    let parentId = null;
    if (state.currentNodeId) {
      const currentNode = vfs.getNodeById(state.currentNodeId);
      if (currentNode) {
        if (currentNode.type === 'folder') {
          parentId = currentNode.id;
        } else {
          // 当前是文件，使用其父节点
          parentId = currentNode.parentId;
        }
      }
    }
    
    const node = vfs.createFile(parentId, fileNameWithExt, content);
    tree.renderTree();
    selectNode(node);
    updateStatus(`${t('file.imported')}: ${fileName}`);
  });

  // 监听刷新工作区事件（导入笔记后）
  ipcRenderer.removeAllListeners('refresh-workspace');
  ipcRenderer.on('refresh-workspace', async () => {
    await refreshWorkspace();
    updateStatus(t('file.workspaceRefreshed') || '工作区已刷新');
  });

  try {
    const { root } = await vfs.initWorkspace();
    updateStatus(`${t('status.workspace')}: ${root}`);

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
          updateStatus(`${t('file.moved')}: ${targetNode.name}`);
        } catch (err) { }
      },
      onInlineRenameCommit: (node, newName) => {
        try {
          vfs.renameNode(node.id, newName);
          const keep = vfs.getNodeById(node.id);
          tree.renderTree();
          if (keep) selectNode(keep);
          updateStatus(t('file.renamedStatus'));
        } catch (err) { }
      },
    });
    tree.renderTree();
    selectFirstAvailableNote();
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
      <div class="menu-item" data-action="new-note">${t('contextMenu.newNote')}</div>
      <div class="menu-item" data-action="new-notebook">${t('contextMenu.newNotebook')}</div>
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
          const node = vfs.createFile(null, t('default.newNote'));
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
          updateStatus(t('status.createdNoteInRoot'));
        } else if (act === 'new-notebook') {
          // 在根目录下创建新笔记本
          const folder = vfs.createFolder(null, t('default.newNotebook'));
          tree.renderTree();
          updateStatus(t('status.createdNotebookInRoot'));
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
    // 初始化大纲
    outline.setupOutlineWhenReady();
    
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
            updateStatus(`${t('file.autoSaved')}: ${node.name}`);
          }
        } catch (e) {
          updateStatus(t('file.autoSaveFailed'));
        }
      }, 800);
    });
  } else {
    setTimeout(setupEditorEvents, 100);
  }
}

/**
 * 刷新工作区(重新加载数据并渲染)
 */
async function refreshWorkspace() {
  try {
    await vfs.initWorkspace();
    tree.renderTree();
  } catch (error) {
    updateStatus(t('file.refreshFailed'));
  }
}

/**
 * 文件操作相关的公共接口
 */
export {
  getDefaultSaveDir,
  updateStatus,
  showFileProperties,
  handleFileAction,
  initializeFileWorkspace,
  setupEditorEvents,
  selectNode as selectFile,
  refreshWorkspace,
};
