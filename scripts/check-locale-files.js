import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 zh-CN.json 作为参考顺序
const localesDir = path.join(__dirname, '../src/locales');
const referenceFile = path.join(localesDir, 'zh-CN.json');

console.log('[INFO] 读取参考简体中文语言文件: zh-CN.json');
const referenceContent = fs.readFileSync(referenceFile, 'utf8');
const referenceObj = JSON.parse(referenceContent);

// 获取参考文件的键顺序
const referenceKeys = Object.keys(referenceObj);
console.log(`[INFO] 简体中文语言文件包含 ${referenceKeys.length} 个翻译主键\n`);

// 获取所有语言文件
const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.json') && file !== 'zh-CN.json');

console.log(`[INFO] 找到 ${localeFiles.length} 个语言文件\n`);

let processedCount = 0;
let errorCount = 0;
const filesWithMissingKeys = [];
const failedFiles = [];

localeFiles.forEach(file => {
  try {
    const filePath = path.join(localesDir, file);
    
    // 读取当前文件
    const content = fs.readFileSync(filePath, 'utf8');
    const currentObj = JSON.parse(content);
    
    // 创建新的有序对象
    const sortedObj = {};
    
    // 按照参考文件的顺序添加键
    referenceKeys.forEach(key => {
      if (currentObj.hasOwnProperty(key)) {
        sortedObj[key] = currentObj[key];
      }
    });
    
    // 检查是否有多余的键（不在参考文件中的）
    const extraKeys = Object.keys(currentObj).filter(key => !referenceKeys.includes(key));
    if (extraKeys.length > 0) {
      console.log(`[WARN] ${file}`);
      console.log(`       发现 ${extraKeys.length} 个额外的键: ${extraKeys.join(', ')}\n`);
      // 将额外的键添加到末尾
      extraKeys.forEach(key => {
        sortedObj[key] = currentObj[key];
      });
    }
    
    // 检查是否有缺失的键
    const missingKeys = referenceKeys.filter(key => !currentObj.hasOwnProperty(key));
    if (missingKeys.length > 0) {
      console.log(`[WARN] ${file}`);
      console.log(`       缺少 ${missingKeys.length} 个键: ${missingKeys.join(', ')}\n`);
      filesWithMissingKeys.push({
        file,
        count: missingKeys.length,
        keys: missingKeys
      });
    }
    
    // 写回文件，保持格式
    const sortedContent = JSON.stringify(sortedObj, null, 2) + '\n';
    fs.writeFileSync(filePath, sortedContent, 'utf8');
    
    processedCount++;
    
  } catch (error) {
    console.error(`[ERROR] ${file}`);
    console.error(`        错误: ${error.message}\n`);
    failedFiles.push({ file, error: error.message });
    errorCount++;
  }
});

console.log('='.repeat(50));
console.log(`\n[INFO] 处理结果:`);
console.log(`       排序处理完成: ${processedCount - errorCount} 个语言文件`);
if (errorCount > 0) {
  console.log(`       排序处理失败: ${errorCount} 个语言文件`);
}
if (filesWithMissingKeys.length > 0) {
  console.log(`       翻译主键缺失: ${filesWithMissingKeys.length} 个语言文件`);
}

if (failedFiles.length > 0) {
  console.log(`\n[INFO] 以下语言文件处理失败:`);
  failedFiles.forEach(({ file, error }) => {
    console.log(`       - ${file}: ${error}`);
  });
}

if (filesWithMissingKeys.length > 0) {
  console.log(`\n[INFO] 以下语言文件缺少翻译键:`);
  filesWithMissingKeys.forEach(({ file, count, keys }) => {
    console.log(`       - ${file}: 缺少 ${count} 个键`);
    console.log(`         ${keys.join(', ')}`);
  });
}

if (errorCount === 0 && filesWithMissingKeys.length === 0) {
  console.log(`\n[INFO] 其他语言文件与简体中文语言排序一致！\n`);
} else {
  console.log(`\n[INFO] 排序完成，但语言文件缺少翻译键，需要处理\n`);
}
