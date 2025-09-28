import state from './state.js';

const electronAPI = window.electronAPI;

if (!electronAPI) {
  throw new Error('electronAPI 未初始化，无法在渲染进程访问受信任的 Node API');
}

const {
  fs: electronFs,
  path: electronPath,
  os: electronOs,
} = electronAPI;

function randomId() {
  if (typeof crypto !== 'undefined') {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    if (crypto.getRandomValues) {
      const buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);
      return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDefaultWorkspaceRoot() {
  const appName = 'NoteWizard';
  const platform = electronOs.platform();
  const homeDir = electronOs.homedir() || '';

  if (platform === 'win32') {
    return electronPath.join(homeDir, 'Documents', appName);
  }
  if (platform === 'darwin') {
    return electronPath.join(homeDir, 'Library', 'Application Support', appName);
  }
  return electronPath.join(homeDir, `.${appName}`);
}

function nwDir(root) {
  return electronPath.join(root, 'Database');
}

function objectsDir(root) {
  return electronPath.join(nwDir(root), 'objects');
}

function trashDir(root) {
  return electronPath.join(nwDir(root), 'trash');
}

function nodesFile(root) {
  return electronPath.join(nwDir(root), 'nodes.jsonl');
}

function metaFile(root) {
  return electronPath.join(nwDir(root), 'meta.json');
}

function ensureWorkspaceStructure(root) {
  const nwd = nwDir(root);
  const obj = objectsDir(root);
  const tr = trashDir(root);
  if (!electronFs.existsSync(nwd)) electronFs.mkdirSync(nwd, { recursive: true });
  if (!electronFs.existsSync(obj)) electronFs.mkdirSync(obj, { recursive: true });
  if (!electronFs.existsSync(tr)) electronFs.mkdirSync(tr, { recursive: true });
  if (!electronFs.existsSync(nodesFile(root))) electronFs.writeFileSync(nodesFile(root), '', 'utf-8');
  if (!electronFs.existsSync(metaFile(root))) {
    const meta = { workspaceId: randomId(), version: 1, createdAt: Date.now(), lastOpenedAt: Date.now() };
    electronFs.writeFileSync(metaFile(root), JSON.stringify(meta, null, 2), 'utf-8');
  }
}

function loadAllNodes(root) {
  const file = nodesFile(root);
  const nodes = new Map();
  if (!electronFs.existsSync(file)) return nodes;
  const content = electronFs.readFileSync(file, 'utf-8');
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
  electronFs.writeFileSync(tmp, lines.join('\n') + (lines.length ? '\n' : ''), 'utf-8');
  electronFs.renameSync(tmp, nodesFile(root));
}

function initWorkspace(rootPath) {
  let root = rootPath || localStorage.getItem('noteSavePath') || getDefaultWorkspaceRoot();

  try {
    if (!electronFs.existsSync(root)) {
      electronFs.mkdirSync(root, { recursive: true });
    }
  } catch (error) {
    root = getDefaultWorkspaceRoot();
  }

  ensureWorkspaceStructure(root);

  const nodes = loadAllNodes(root);
  state.workspaceRoot = root;
  state.nodes = nodes;

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
    trashed: false,
  };
  return saveNode(node);
}

function createFile(parentId, name, content = '') {
  const contentId = randomId();
  const filePath = electronPath.join(objectsDir(state.workspaceRoot), `${contentId}.md`);
  const fileContent = content || `# ${name}\n\n`;
  electronFs.writeFileSync(filePath, fileContent, 'utf-8');

  const displayName = name.endsWith('.md') ? name.slice(0, -3) : name;

  const node = {
    id: randomId(),
    type: 'file',
    name: displayName,
    fileName: name.endsWith('.md') ? name : `${name}.md`,
    parentId,
    order: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    contentId,
    trashed: false,
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

function restoreNode(id) {
  const node = getNodeById(id);
  if (!node || !node.trashed) return false;

  node.trashed = false;
  delete node.trashedAt;

  if (node.type === 'file' && node.contentId) {
    const trashPath = electronPath.join(trashDir(state.workspaceRoot), `${node.contentId}.md`);
    const targetPath = electronPath.join(objectsDir(state.workspaceRoot), `${node.contentId}.md`);

    if (electronFs.existsSync(trashPath)) {
      electronFs.renameSync(trashPath, targetPath);
    }
  }

  const children = listChildren(id, true);
  for (const child of children) {
    restoreNode(child.id);
  }

  persistAllNodes(state.workspaceRoot, state.nodes);
  return true;
}

function deleteNode(id, permanent = false) {
  const node = getNodeById(id);
  if (!node) return false;

  if (permanent) {
    if (node.type === 'file' && node.contentId) {
      const baseDir = node.trashed ? trashDir(state.workspaceRoot) : objectsDir(state.workspaceRoot);
      const contentPath = electronPath.join(baseDir, `${node.contentId}.md`);
      if (electronFs.existsSync(contentPath)) {
        electronFs.unlinkSync(contentPath);
      }
    }
    state.nodes.delete(id);
    const children = listChildren(id, true);
    for (const child of children) {
      deleteNode(child.id, true);
    }
  } else {
    node.trashed = true;
    node.trashedAt = new Date().toISOString();
    if (node.type === 'file' && node.contentId) {
      const sourcePath = electronPath.join(objectsDir(state.workspaceRoot), `${node.contentId}.md`);
      const trashPath = electronPath.join(trashDir(state.workspaceRoot), `${node.contentId}.md`);

      if (!electronFs.existsSync(trashDir(state.workspaceRoot))) {
        electronFs.mkdirSync(trashDir(state.workspaceRoot), { recursive: true });
      }

      if (electronFs.existsSync(sourcePath)) {
        electronFs.renameSync(sourcePath, trashPath);
      }
    }
    const children = listChildren(id, true);
    for (const child of children) {
      deleteNode(child.id, false);
    }
  }

  persistAllNodes(state.workspaceRoot, state.nodes);
  return true;
}

function readContent(contentId) {
  const p = electronPath.join(objectsDir(state.workspaceRoot), `${contentId}.md`);
  if (electronFs.existsSync(p)) return electronFs.readFileSync(p, 'utf-8');
  return '';
}

function writeContent(contentId, text) {
  const p = electronPath.join(objectsDir(state.workspaceRoot), `${contentId}.md`);
  electronFs.writeFileSync(p, text, 'utf-8');
}

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

export {
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
