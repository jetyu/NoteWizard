import * as fs from "node:fs";
import * as path from "node:path";

/**
 * 笔记导出模块
 * 负责将笔记数据打包为 .nwp 格式
 */

/**
 * 创建导出管理器
 * @param {Object} dependencies - 依赖注入
 * @param {Object} dependencies.app - Electron app 实例
 * @param {Object} dependencies.dialog - Electron dialog 实例
 * @param {Function} dependencies.getPreference - 获取配置的函数
 * @param {Function} dependencies.t - 国际化翻译函数
 * @returns {Object} 导出管理器实例
 */
export function createExporter(dependencies) {
  const { app, dialog, getPreference, t, AdmZip } = dependencies;

  /**
   * 获取数据库目录路径
   * @returns {string|null} 数据库目录路径
   */
  function getDatabaseDir() {
    const workspaceRoot = getPreference('noteSavePath', null);
    if (!workspaceRoot) {
      return null;
    }
    return path.join(workspaceRoot, 'Database');
  }

  /**
   * 统计笔记数量（只统计文件类型，不包括文件夹）
   * @param {string} nodesFilePath - nodes.jsonl 文件路径
   * @returns {Object} 笔记统计 { total, active, trashed }
   */
  function countNotes(nodesFilePath) {
    if (!fs.existsSync(nodesFilePath)) {
      return { total: 0, active: 0, trashed: 0 };
    }
    const content = fs.readFileSync(nodesFilePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    
    let activeCount = 0;
    let trashedCount = 0;
    
    for (const line of lines) {
      try {
        const node = JSON.parse(line);
        if (node.type === 'file') {
          if (node.trashed) {
            trashedCount++;
          } else {
            activeCount++;
          }
        }
      } catch (error) {
        // 忽略解析错误的行
      }
    }
    
    return {
      total: activeCount + trashedCount,
      active: activeCount,
      trashed: trashedCount
    };
  }

  /**
   * 生成导出清单
   * @param {Object} noteStats - 笔记统计 { total, active, trashed }
   * @returns {Object} 清单对象
   */
  function generateManifest(noteStats) {
    return {
      version: '1.0',
      appVersion: app.getVersion(),
      exportDate: new Date().toISOString(),
      noteCount: noteStats.total,
      activeNotes: noteStats.active,
      trashedNotes: noteStats.trashed,
      description: t('export.notewizard.manifest.description')
    };
  }

  /**
   * 添加文件到 ZIP
   * @param {AdmZip} zip - ZIP 实例
   * @param {string} filePath - 文件路径
   * @param {string} zipPath - ZIP 内路径
   */
  function addFileToZip(zip, filePath, zipPath) {
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(zipPath);
      const dirName = path.dirname(zipPath);
      zip.addLocalFile(filePath, dirName === '.' ? '' : dirName, fileName);
    }
  }

  /**
   * 添加目录到 ZIP
   * @param {AdmZip} zip - ZIP 实例
   * @param {string} dirPath - 目录路径
   * @param {string} zipPath - ZIP 内路径
   */
  function addFolderToZip(zip, dirPath, zipPath) {
    if (fs.existsSync(dirPath)) {
      zip.addLocalFolder(dirPath, zipPath);
    }
  }

  /**
   * 执行导出操作
   * @param {BrowserWindow} win - 主窗口实例
   * @returns {Promise<Object>} 导出结果
   */
  async function exportNotes(win) {
    try {
      // 检查数据库目录
      const databaseDir = getDatabaseDir();
      if (!databaseDir) {
        return { 
          success: false, 
          error: t('export.notewizard.error.noWorkspace')
        };
      }

      if (!fs.existsSync(databaseDir)) {
        return { 
          success: false, 
          error: t('export.notewizard.error.databaseNotExist')
        };
      }

      // 显示保存对话框
      // 生成时间戳格式：YYMMDD_HHmm
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const timestamp = `${year}${month}${day}_${hour}${minute}`;

      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: t('export.notewizard.dialog.title'),
        defaultPath: `NoteWizard_Package_${timestamp}.nwp`,
        filters: [
          { 
            name: t('export.notewizard.dialog.filterName'), 
            extensions: ['nwp'] 
          },
          { 
            name: t('export.notewizard.dialog.allFiles'), 
            extensions: ['*'] 
          }
        ]
      });

      if (canceled || !filePath) {
        return { 
          success: false, 
          cancelled: true
        };
      }

      // 创建 ZIP 文件
      const zip = new AdmZip();

      // 统计笔记数量
      const nodesFilePath = path.join(databaseDir, 'nodes.jsonl');
      const noteStats = countNotes(nodesFilePath);

      // 生成并添加 manifest.json
      const manifest = generateManifest(noteStats);
      zip.addFile(
        'manifest.json', 
        Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
      );

      // 添加核心文件
      addFileToZip(zip, nodesFilePath, 'nodes.jsonl');
      addFileToZip(zip, path.join(databaseDir, 'meta.json'), 'meta.json');

      // 添加目录
      addFolderToZip(zip, path.join(databaseDir, 'objects'), 'objects');
      addFolderToZip(zip, path.join(databaseDir, 'images'), 'images');
      addFolderToZip(zip, path.join(databaseDir, 'trash'), 'trash');

      // 写入 ZIP 文件
      zip.writeZip(filePath);

      return {
        success: true,
        filePath: filePath,
        noteCount: noteStats.total,
        activeNotes: noteStats.active,
        trashedNotes: noteStats.trashed
      };
    } catch (error) {
      console.error('[Exporter] 导出失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  return {
    exportNotes
  };
}
