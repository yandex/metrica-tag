import * as fs from 'fs';

export function readAsJSON<T>(path: string): T {
    const content = fs.readFileSync(path, 'utf8');
    return JSON.parse(content);
}
