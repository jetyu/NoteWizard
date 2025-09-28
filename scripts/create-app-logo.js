import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import iconGen from 'icon-gen';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const config = {
  // 源图片路径
  sourceImage: path.join(__dirname, '..', 'src', 'assets', 'logo','source', 'logo_source.png'),
  // 输出目录
  outputDir: path.join(__dirname, '..', 'src', 'assets', 'logo'),
  // 需要生成的PNG尺寸
  pngSizes: [16, 24, 32, 48, 64, 96, 128, 256, 512],
  // ICO文件包含的尺寸
  icoSizes: [16, 24, 32, 48, 64, 96, 128, 256, 512],
  // 输出文件名（不含扩展名）
  outputName: 'app-logo',
};

// 确保目录存在
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// 生成单张图片
async function generateImage(size, format = 'png') {
  const outputFile = path.join(config.outputDir, `${config.outputName}-${size}.${format}`);
  
  try {
    await sharp(config.sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(outputFile);
    
    console.log(`✅ 已生成: ${path.basename(outputFile)}`);
    return outputFile;
  } catch (error) {
    console.error(`❌ 生成 ${size}x${size} 图标失败:`, error.message);
    return null;
  }
}

// 生成ICO文件
async function generateIco() {
  const outputFile = path.join(config.outputDir, `${config.outputName}.ico`);
  
  try {
    // 生成一个高质量的PNG作为源
    const tempPng = path.join(config.outputDir, 'temp-512.png');
    await sharp(config.sourceImage)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(tempPng);
    
    // 使用icon-gen生成ICO
    await iconGen(tempPng, config.outputDir, {
      name: config.outputName,
      modes: ['ico'],
      ico: { // 指定ICO尺寸
        name: config.outputName,
        sizes: config.icoSizes
      },
      report: false
    });
    
    // 清理临时文件
    await fs.unlink(tempPng).catch(() => {});
    
    console.log(`✅ 已生成: ${path.basename(outputFile)} (包含尺寸: ${config.icoSizes.join('x')}px)`);
    return outputFile;
  } catch (error) {
    console.error('❌ 生成ICO文件失败:', error.message);
    return null;
  }
}

// 生成所有PNG图标
async function generateAllPngs() {
  const results = [];
  for (const size of config.pngSizes) {
    results.push(await generateImage(size, 'png'));
  }
  return results.filter(Boolean);
}

// 主函数
async function main() {
  console.log('🔄 开始生成应用程序图标...\n');
  
  try {
    // 确保输出目录存在
    await ensureDir(config.outputDir);
    
    console.log('🖼️  生成PNG图标...');
    const pngResults = await generateAllPngs();
    
    console.log('\n🎨 生成ICO图标...');
    const icoResult = await generateIco();
    
    console.log('\n✨ 图标生成完成！');
    console.log('📁 输出目录:', config.outputDir);
    console.log('\n生成的文件:');
    
    // 显示生成的文件列表
    const files = await fs.readdir(config.outputDir);
    files
      .filter(file => file.startsWith(config.outputName))
      .sort((a, b) => {
        // 按文件类型和尺寸排序
        const getSize = name => parseInt(name.match(/\d+/)?.[0] || '0');
        const sizeA = getSize(a);
        const sizeB = getSize(b);
        if (sizeA !== sizeB) return sizeA - sizeB;
        return a.localeCompare(b);
      })
      .forEach(file => console.log(`  - ${file}`));
    
    console.log('\n✅ 所有图标已准备就绪！');
  } catch (error) {
    console.error('\n❌ 生成图标时出错:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();
