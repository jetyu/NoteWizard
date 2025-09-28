import builder from 'electron-builder';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 构建配置
const packageJsonPath = path.join(__dirname, 'package.json');
const config = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).build;

// 清理之前的构建目录
function cleanDist() {
  console.log('清理构建目录...');
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  fs.mkdirSync(distPath, { recursive: true });
}

// 构建应用
async function buildApp() {
  console.log('开始构建应用...');
  
  try {
    // 安装依赖
    console.log('安装依赖...');
    execSync('npm install', { stdio: 'inherit' });

    // 构建渲染进程
    console.log('构建渲染进程...');
    // 如果有前端构建步骤，可以在这里添加
    // 例如: execSync('npm run build:renderer', { stdio: 'inherit' });

    // 打包应用
    console.log('打包应用...');
    
    // 设置目标平台
    const platform = process.platform === 'win32' ? 'win' : 
                   process.platform === 'darwin' ? 'mac' : 'linux';
    
    console.log(`目标平台: ${platform}`);
    
    // 构建选项
    const buildOptions = {
      config: config,
      [platform]: ['x64'],  // 默认构建 x64 架构
    };
    
    // 如果是 Windows，添加 32 位支持
    if (platform === 'win') {
      buildOptions.win = ['x64', 'ia32'];
    }
    
    // 执行构建
    const platformName = platform === 'win' ? 'WINDOWS' : platform.toUpperCase();
    await builder.build({
      targets: builder.Platform[platformName].createTarget(),
      config: config,
    });

    console.log('构建成功！');
    console.log(`安装包位置: ${path.join(__dirname, 'dist')}`);
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}

// 执行构建
async function main() {
  console.log('NoteWizard 构建工具');
  console.log('======================');
  
  cleanDist();
  await buildApp();
}

main();
