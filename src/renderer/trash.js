const { ipcRenderer } = window.require("electron");
const fs = window.require("fs");
const path = window.require("path");
const i18n = require("./i18n");
const vfs = require('./vfs');
const state = require('./state');
const tree = require('./tree');

// 初始化
function initTrash() {
  bindEvents();
  
  // 确保回收站目录存在
  const { app } = window.require('@electron/remote');
  const trashPath = path.join(app.getPath('documents'), 'NoteWizard', 'Database', 'trash');
  if (!fs.existsSync(trashPath)) {
    fs.mkdirSync(trashPath, { recursive: true });
  }
}

// 绑定事件
function bindEvents() {
  // 监听主进程发送的打开回收站事件
  ipcRenderer?.on("open-trash", () => {
    showTrashDialog();
  });

  // 监听回收站更新事件
  ipcRenderer?.on('trash-updated', () => {
    if (dialog && !dialog.classList.contains('hidden')) {
      loadTrashItems();
    }
  });
}

// 确保对话框已创建
async function ensureModalExists() {
  if (document.getElementById('trash-modal')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'trash-modal';
  wrapper.className = 'modal hidden';
  wrapper.setAttribute('role', 'dialog');
  wrapper.setAttribute('aria-modal', 'true');
  wrapper.setAttribute('aria-labelledby', 'pref-title');

  try {
    // 使用 require 导入模板内容
    const { join } = window.require('path');
    const { readFileSync } = window.require('fs');

    // 获取模板文件的绝对路径
    const templatePath = join(__dirname, '../templates/trash.html');
    const htmlContent = readFileSync(templatePath, 'utf8');

    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);

    // 应用国际化
    if (i18n && typeof i18n.applyI18n === 'function') {
      i18n.applyI18n();
    }

    // 绑定关闭按钮事件
    const closeBtn = wrapper.querySelector('#trash-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // 绑定清空回收站按钮事件
    const emptyBtn = wrapper.querySelector('#empty-trash-btn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', async () => {
        if (confirm('确定要清空回收站吗？此操作无法撤销！')) {
          try {
            const removed = vfs.emptyTrash();
            // 刷新列表
            loadTrashItems();
            // 刷新左侧笔记树
            if (typeof tree.renderTree === 'function') {
              tree.renderTree();
            }
            // 通知主进程更新UI
            ipcRenderer.send('trash-updated');
          } catch (err) {
            console.error('清空回收站失败:', err);
          }
        }
      });
    }

    // 绑定键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  } catch (error) {
  }
}

// 显示回收站对话框
async function showTrashDialog() {
  try {
    console.log('显示回收站对话框');
    // 确保对话框已创建
    await ensureModalExists();
    
    const dialog = document.getElementById('trash-modal');
    if (!dialog) {
      console.error('无法创建回收站对话框');
      return;
    }

    // 确保i18n已初始化
    if (i18n?.init) {
      await i18n.init();
      // 应用i18n翻译
      if (i18n.applyI18n) {
        i18n.applyI18n(dialog);
      }
    }

    // 显示对话框
    console.log('显示对话框');
    dialog.style.display = 'flex';
    dialog.classList.remove('hidden');
    dialog.setAttribute('aria-hidden', 'false');

    // 设置焦点到对话框
    const focusable = dialog.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    // 加载回收站内容
    await loadTrashItems();
  } catch (error) {
    console.error('显示回收站对话框时出错:', error);
  }
}

// 加载回收站项目
function loadTrashItems() {
  try {
    const tbody = document.getElementById('trash-list');
    if (!tbody) return;
  
  // 清空现有内容
  tbody.innerHTML = '';
  
  // 获取所有已删除的节点
  const trashedNodes = [];
  for (const [id, node] of state.nodes) {
    if (node.trashed) {
      trashedNodes.push({
        id: id,
        name: node.name,
        type: node.type,
        trashedAt: node.trashedAt || new Date().toISOString(),
        fileName: node.fileName || '',
        parentId: node.parentId
      });
    }
  }
  
  // 如果没有已删除的项目，显示提示
  if (trashedNodes.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3" class="text-center" data-i18n="trash.empty">回收站是空的</td>';
    tbody.appendChild(row);
    return;
  }
  
  // 按删除时间倒序排序
  trashedNodes.sort((a, b) => new Date(b.trashedAt) - new Date(a.trashedAt));
  
  // 添加项目到表格（与模板三列对齐：名称 / 文件名 / 操作）
  trashedNodes.forEach(item => {
    const row = document.createElement('tr');
    // const trashedDate = new Date(item.trashedAt);
    // const formattedDate = trashedDate.toLocaleString();
    
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.type === 'file' ? (item.fileName || (item.name + '.md')) : '-'}</td>
      <td class="actions">
        <button class="btn-restore" data-id="${item.id}" data-i18n="trash.restore">恢复</button>
        <button class="btn-delete" data-id="${item.id}" data-i18n="trash.delete">永久删除</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // 绑定恢复按钮事件
  tbody.querySelectorAll('.btn-restore').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id && confirm('确定要恢复此项目吗？')) {
        vfs.restoreNode(id);
        loadTrashItems(); // 刷新回收站列表
        if (typeof tree.renderTree === 'function') {
          tree.renderTree(); // 立即刷新左侧笔记树
        }
        // 通知主进程更新UI
        ipcRenderer.send('trash-updated');
      }
    });
  });
  
  // 绑定删除按钮事件
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id && confirm('确定要永久删除此项目吗？此操作无法撤销！')) {
        vfs.deleteNode(id, true); // 永久删除
        loadTrashItems(); // 刷新回收站列表
        if (typeof tree.renderTree === 'function') {
          tree.renderTree(); // 立即刷新左侧笔记树
        }
        // 通知主进程更新UI
        ipcRenderer.send('trash-updated');
      }
    });
  });
  
    // 应用国际化
    if (i18n && typeof i18n.applyI18n === 'function') {
      i18n.applyI18n(tbody);
    }
  } catch (error) {
    console.error('加载回收站项目失败:', error);
  }
}

// 关闭对话框
function closeModal() {
  console.log('关闭对话框');
  const modal = document.getElementById('trash-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// 导出公共接口
module.exports = {
  initTrash,
  showTrashDialog,
  closeModal,
};
