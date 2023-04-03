import { promises } from 'fs';
import { join } from 'path';

type SizeInfo = {
  [scriptName: string]: {
    [extention: string]: {
      current: number,
      before: number,
      diff: number
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
        diff: stats.size - before
      }
    }
  }
  console.log(JSON.stringify(result));
}
run();
