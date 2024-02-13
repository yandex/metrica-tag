import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

export const DEFAULT_BUNDLE_VERSION = '25';

const buildDirStr = '_build';
export const buildDir = (str: string) => {
    return path.join(buildDirStr, str);
};

const UTF_8_BOM_SYMBOL = '\ufeff';
export const addBOMMark = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, UTF_8_BOM_SYMBOL + content, {
        encoding: 'utf8',
    });
};

export const emptyBuildDir = async (bundle: string, createOnly = false) => {
    const bundleDir = buildDir(bundle);
    await fsp.mkdir(bundleDir, { recursive: true });
    if (createOnly) {
        return;
    }
    const files = await fsp.readdir(bundleDir);

    await Promise.all(
        files
            .filter((file) => file !== 'package.json')
            .map((file) => fsp.unlink(path.join(bundleDir, file))),
    );
};
