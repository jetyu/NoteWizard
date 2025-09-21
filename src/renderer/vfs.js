const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const state = require('./state');

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
  );
}

function getDefaultWorkspaceRoot() {
  // 使用 Documents/NoteWizard 作为工作区根目录
  let baseDir = '';
  const appName = 'NoteWizard';
  
  if (process.platform === 'win32') {
    baseDir = path.join(os.homedir(), 'Documents', appName);
  } else if (process.platform === 'darwin') {
    baseDir = path.join(os.homedir() || '', 'Library', 'Application Support', appName);
  } else {
    baseDir = path.join(os.homedir() || '', `.${appName}`);
  }
  
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true, mode: 0o755 });
    }
  } catch (error) {
  }
  
  return baseDir;
}

function nwDir(root) {
  return path.join(root, 'Database');
}

function objectsDir(root) {
  return path.join(nwDir(root), 'objects');
}

function trashDir(root) {
  return path.join(nwDir(root), 'trash');
}

function nodesFile(root) {
  return path.join(nwDir(root), 'nodes.jsonl');
}

function metaFile(root) {
  return path.join(nwDir(root), 'meta.json');
}

function ensureWorkspaceStructure(root) {
  const nwd = nwDir(root);
  const obj = objectsDir(root);
  const tr = trashDir(root);
  if (!fs.existsSync(nwd)) fs.mkdirSync(nwd, { recursive: true });
  if (!fs.existsSync(obj)) fs.mkdirSync(obj, { recursive: true });
  if (!fs.existsSync(tr)) fs.mkdirSync(tr, { recursive: true });
  if (!fs.existsSync(nodesFile(root))) fs.writeFileSync(nodesFile(root), '', 'utf-8');
  if (!fs.existsSync(metaFile(root))) {
    const meta = { workspaceId: randomId(), version: 1, createdAt: Date.now(), lastOpenedAt: Date.now() };
    fs.writeFileSync(metaFile(root), JSON.stringify(meta, null, 2), 'utf-8');
  }
}

function loadAllNodes(root) {
  const file = nodesFile(root);
  const nodes = new Map();
  if (!fs.existsSync(file)) return nodes;
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const n = JSON.parse(line);
      nodes.set(n.id, n);
    } catch (_) {}
  }
  return nodes;
}

function persistAllNodes(root, nodesMap) {
  const lines = [];
  for (const n of nodesMap.values()) {
    lines.push(JSON.stringify(n));
  }
  const tmp = nodesFile(root) + '.tmp';
  fs.writeFileSync(tmp, lines.join('\n') + (lines.length ? '\n' : ''), 'utf-8');
  fs.renameSync(tmp, nodesFile(root));
}

function initWorkspace(rootPath) {
  // 优先使用传入的路径，否则尝试从 localStorage 获取用户设置的路径，最后使用默认路径
  let root = rootPath || localStorage.getItem('noteSavePath')|| getDefaultWorkspaceRoot();
  
  // 确保路径存在
  try {
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
  } catch (error) {
    root = getDefaultWorkspaceRoot();
  }
  
  ensureWorkspaceStructure(root);
  
  // 加载所有节点
  let nodes = loadAllNodes(root);
  
  // 更新状态
  state.workspaceRoot = root;
  state.nodes = nodes;
  
  // 确保路径保存到 localStorage
  localStorage.setItem('noteSavePath', root);
  
  return { root, nodes };
}

function listChildren(parentId, includeTrashed = false) {
  const arr = [];
  for (const n of state.nodes.values()) {
    if (n.parentId === parentId && (includeTrashed || !n.trashed)) {
      arr.push(n);
    }
  }
  arr.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  return arr;
}

function saveNode(node) {
  node.updatedAt = Date.now();
  // 确保文件节点有fileName字段
  if (node.type === 'file' && !node.fileName) {
    node.fileName = node.name.endsWith('.md') ? node.name : `${node.name}.md`;
  }
  state.nodes.set(node.id, node);
  persistAllNodes(state.workspaceRoot, state.nodes);
  return node;
}

function createFolder(parentId, name) {
  const node = { 
    id: randomId(), 
    type: 'folder', 
    name, 
    parentId, 
    order: Date.now(), 
    createdAt: Date.now(), 
    updatedAt: Date.now(),
    trashed: false // 添加trashed字段，默认为false
  };
  return saveNode(node);
}

function createFile(parentId, name, content = '') {
  const contentId = randomId();
  const filePath = path.join(objectsDir(state.workspaceRoot), contentId + '.md');
  const fileContent = content || `# ${name}\n\n`;
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  
  const displayName = name.endsWith('.md') ? name.slice(0, -3) : name;
  
  const node = { 
    id: randomId(), 
    type: 'file', 
    name: displayName, // 显示时不带扩展名
    fileName: name.endsWith('.md') ? name : `${name}.md`, // 实际文件名带扩展名
    parentId, 
    order: Date.now(), 
    createdAt: Date.now(), 
    updatedAt: Date.now(), 
    contentId,
    trashed: false // 添加trashed字段，默认为false
  };
  return saveNode(node);
}

function getNodeById(id) {
  return state.nodes.get(id) || null;
}

function moveNode(id, newParentId, newOrder) {
  const node = getNodeById(id);
  if (!node) return null;
  node.parentId = newParentId;
  if (newOrder != null) node.order = newOrder;
  return saveNode(node);
}

function renameNode(id, newName) {
  const node = getNodeById(id);
  if (!node) return null;
  node.name = newName;
  return saveNode(node);
}

/**
 * 恢复已删除的节点
 * @param {string} id - 要恢复的节点ID
 * @returns {boolean} 是否成功恢复
 */
function restoreNode(id) {
  const node = getNodeById(id);
  if (!node || !node.trashed) return false;
  
  // 恢复节点
  node.trashed = false;
  delete node.trashedAt;
  
  // 如果是文件，从回收站移回原位置
  if (node.type === 'file' && node.contentId) {
    const trashPath = path.join(trashDir(state.workspaceRoot), node.contentId + '.md');
    const targetPath = path.join(objectsDir(state.workspaceRoot), node.contentId + '.md');
    
    if (fs.existsSync(trashPath)) {
      fs.renameSync(trashPath, targetPath);
    }
  }
  
  // 递归恢复子节点
  const children = listChildren(id, true);
  for (const child of children) {
    restoreNode(child.id);
  }
  
  persistAllNodes(state.workspaceRoot, state.nodes);
  return true;
}

/**
 * 删除节点（移动到回收站或永久删除）
 * @param {string} id - 要删除的节点ID
 * @param {boolean} permanent - 是否永久删除
 * @returns {boolean} 是否成功删除
 */
function deleteNode(id, permanent = false) {
  const node = getNodeById(id);
  if (!node) return false;
  
  // 如果是永久删除
  if (permanent) {
    // 如果是文件，删除对应的内容文件
    if (node.type === 'file' && node.contentId) {
      const baseDir = node.trashed ? trashDir(state.workspaceRoot) : objectsDir(state.workspaceRoot);
      const contentPath = path.join(baseDir, node.contentId + '.md');
      if (fs.existsSync(contentPath)) {
        fs.unlinkSync(contentPath);
      }
    }
    // 从节点列表中删除
    state.nodes.delete(id);
    // 递归删除子节点
    const children = listChildren(id, true);
    for (const child of children) {
      deleteNode(child.id, true);
    }
  } else {
    // 标记为已删除（移动到回收站）
    node.trashed = true;
    node.trashedAt = new Date().toISOString();
    // 如果是文件，移动到回收站目录
    if (node.type === 'file' && node.contentId) {
      const sourcePath = path.join(objectsDir(state.workspaceRoot), node.contentId + '.md');
      const trashPath = path.join(trashDir(state.workspaceRoot), node.contentId + '.md');
      
      // 确保回收站目录存在
      if (!fs.existsSync(trashDir(state.workspaceRoot))) {
        fs.mkdirSync(trashDir(state.workspaceRoot), { recursive: true });
      }
      
      // 移动文件到回收站
      if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, trashPath);
      }
    }
    // 递归标记子节点
    const children = listChildren(id, true);
    for (const child of children) {
      deleteNode(child.id, false);
    }
  }
  
  persistAllNodes(state.workspaceRoot, state.nodes);
  return true;
}

function readContent(contentId) {
  const p = path.join(objectsDir(state.workspaceRoot), contentId + '.md');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  return '';
}

function writeContent(contentId, text) {
  const p = path.join(objectsDir(state.workspaceRoot), contentId + '.md');
  fs.writeFileSync(p, text, 'utf-8');
}

/**
 * 清空回收站：永久删除所有已被标记为 trashed 的根节点
 * 根节点定义：自身 trashed 为 true，且其父节点不存在或未被标记为 trashed
 * 这样可以避免对子树的重复删除
 * @returns {number} 被删除的根节点数量
 */
function emptyTrash() {
  const trashedRoots = [];
  for (const node of state.nodes.values()) {
    if (node.trashed) {
      const parent = node.parentId ? getNodeById(node.parentId) : null;
      if (!parent || !parent.trashed) {
        trashedRoots.push(node);
      }
    }
  }

  for (const n of trashedRoots) {
    deleteNode(n.id, true);
  }

  return trashedRoots.length;
}

module.exports = {
  getDefaultWorkspaceRoot,
  initWorkspace,
  listChildren,
  createFolder,
  createFile,
  moveNode,
  renameNode,
  deleteNode,
  restoreNode,
  getNodeById,
  readContent,
  writeContent,
  emptyTrash,
};
