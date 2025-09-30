import icongen from 'icon-gen';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  type: 'png',
  modes: ['icns', 'ico'],
  names: {
    icns: 'app-logo',
    ico: 'app-logo'
  },
  report: true
};

const input = path.join(__dirname, '../src/assets/logo/app-logo-512.png');
const output = path.join(__dirname, '../src/assets/logo');

console.log('生成图标文件...');
console.log('输入文件:', input);
console.log('输出目录:', output);

icongen(input, output, options)
  .then((results) => {
    console.log('图标生成成功！');
    results.forEach(result => {
      console.log('  -', result);
    });
  })
  .catch((err) => {
    console.error('图标生成失败:', err);
    process.exit(1);
  });
