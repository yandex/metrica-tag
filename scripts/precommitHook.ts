import os from 'os';
import path from 'path';
import { spawnAsPromised } from './utils/proc';

export const getIndexedFiles = async (
    extensions: string[],
): Promise<string[]> => {
    const root = await spawnAsPromised('git', ['rev-parse', '--show-toplevel']);
    /**
     * git status data in form `XY PATH`,
     * where `X` shows the status of the index
     * and `Y` shows the status of the working tree.
     */
    const status = await spawnAsPromised('git', ['status', '--short']);
    const files = status
        .split(os.EOL)
        .filter((fileInfo) => {
            // Get `X` (status of the file index) from `XY PATH` pattern
            const indexStatus = fileInfo.slice(0, 2)[0].trim();
            return !indexStatus || indexStatus === 'D';
        })
        .map((fileInfo) => fileInfo.slice(2).trim());

    return files
        .filter((filePath) =>
            extensions.includes(filePath.split('.').pop() || ''),
        )
        .map((filePath) => path.join(process.cwd(), root, filePath));
};

(async function precommitHook() {
    try {
        const opts = {
            console: { stdout: true, stderr: false },
        } as const;

        const files = await getIndexedFiles(['ts', 'js']);

        if (files) {
            await spawnAsPromised(
                'npm',
                [
                    'run',
                    'lint',
                    '--',
                    '--fix',
                    '--typecheck',
                    '--code',
                    '--prettier',
                    '--files',
                    ...files,
                ],
                opts,
            );
            await spawnAsPromised('git', ['add', '-v', ...files], opts);
        }
    } catch (e) {
        process.exitCode = 1;
    }
})();
