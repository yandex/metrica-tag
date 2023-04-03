import { promises } from 'fs';
import { join } from 'path';

const formatBytes = (
  bytes: number,
  decimals: number) =>  {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

type SizeInfo = {
  [scriptName: string]: {
    [extention: string]: {
      current: number,
      before: number,
      currentString: string,
      beforeString: string
    }
  }
}

const run = async () => {
  const privious = JSON.parse(process.env['MAIN_BRANCH'] || '{}');
  const { readdir, stat } = promises;
  const directoryPath = './_build/public';
  const result: SizeInfo = {};
  const fileNames = await readdir(directoryPath);
  for (const fileName of fileNames) {
    const filePath = join(directoryPath, fileName);
    const stats = await stat(filePath);
    if (stats.isFile()) {
      const [shortName, ...extention] = fileName.split('.');
      if (!result[shortName]) {
        result[shortName] = {};
      }
      const ext = extention.join('.');
      const before = privious[shortName]?.[ext]?.current || stats.size;
      result[shortName][ext] = {
        current: stats.size,
        before,
        currentString: formatBytes(stats.size, 3),
        beforeString: formatBytes(before, 3)
      }
    }
  }
  console.log(JSON.stringify(result));
}
run();
