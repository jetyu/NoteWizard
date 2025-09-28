const state = {
  editor: null,
  fileContents: new Map(),
  currentFileItem: null,
  currentFilePath: null,
  autoSaveTimer: null,
  currentNodeId: null,
  workspaceRoot: null,
  nodes: new Map(),
};

export default state;
