import { promises } from 'fs';
import { spawnAsPromised } from './utils/proc';

const { readdir, unlink } = promises;

const isProfile = /isolate-.*-v8\.log/;
const summaryRegx = /(\d+)\sticks/;
const tableStart = /\[(.*)\]:/;

type SummaryType = {
    ticks: string;
    name: string;
}[];

const runTest = async (): Promise<SummaryType> => {
    let rootFiles = await readdir('./');
    // eslint-disable-next-line no-restricted-syntax
    for (const file of rootFiles) {
        if (isProfile.test(file)) {
            await unlink(`./${file}`);
        }
    }
    await spawnAsPromised(
        `NODE_ENV=production node --prof scripts/performanceTest.mjs`,
        {
            shell: true,
        },
    );
    rootFiles = await readdir('./');
    // eslint-disable-next-line no-restricted-syntax
    for (const file of rootFiles) {
        if (isProfile.test(file)) {
            const info = await spawnAsPromised(`node --prof-process ${file}`, {
                shell: true,
            });
            const lines = info.split('\n');
            const result: Record<string, any> = {};
            const tableBuffer: [string?, string[]?, ...Record<string, any>[]] =
                [];
            // eslint-disable-next-line no-restricted-syntax
            for (const line of lines) {
                if (line.includes(file)) {
                    const ticks = summaryRegx.exec(line);
                    if (ticks) {
                        result.ticks = parseInt(ticks[1], 10);
                    }
                } else if (tableStart.test(line)) {
                    const regexInfo = tableStart.exec(line);
                    if (!regexInfo) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const tableName = regexInfo[1].replaceAll(' ', '-');
                    if (tableBuffer.length) {
                        const [bufferTableName, , ...data] = tableBuffer;
                        if (!bufferTableName) {
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        result.tables[bufferTableName] = data;
                        tableBuffer.length = 0;
                    }
                    tableBuffer.push(tableName);
                    result.tables = Object.assign(result.tables || {}, {
                        [tableName]: [],
                    });
                } else if (tableBuffer.length === 1) {
                    if (line.substring(0, 3) !== '   ') {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const colums = line.trim().split(/\s+/);
                    tableBuffer.push(colums);
                } else if (tableBuffer.length > 1) {
                    if (line.substring(0, 3) !== '   ') {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const [, colums] = tableBuffer;
                    const columArray = Array.from((colums || []).entries());
                    const columInfo = line.trim().split(/\s+/);
                    const restBorder = columArray.length - 1;
                    const cols = columInfo
                        .slice(0, restBorder)
                        .concat(columInfo.slice(restBorder).join(' '));
                    if (!columInfo[0]) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    const rowResult: Record<string, string> = {};

                    // eslint-disable-next-line no-restricted-syntax
                    for (const [i, columnName] of columArray) {
                        rowResult[columnName] = `${cols[i]}`;
                    }
                    tableBuffer.push(rowResult);
                }
            }
            if (tableBuffer.length) {
                const [bufferTableName, , ...data] = tableBuffer;
                if (!bufferTableName) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                result.tables[bufferTableName] = data;
                tableBuffer.length = 0;
            }
            return result.tables['Summary'];
        }
    }
    return [];
};

const main = async (no = 0): Promise<any> => {
    if (no > 1) {
        throw new Error('Can\t to build bundle for performance test');
    }
    await spawnAsPromised(`npm run build -- --node`, {
        shell: true,
    });
    const summaryDict: {
        [name: string]: {
            ticks: number[];
            average: number;
            deviation: number;
        };
    } = {};
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < 10; i += 1) {
        const summary = await runTest();
        // eslint-disable-next-line no-restricted-syntax
        for (const measurement of summary) {
            let summaryItem = summaryDict[measurement.name];
            if (!summaryItem) {
                summaryItem = {
                    ticks: [],
                    average: NaN,
                    deviation: NaN,
                };
                summaryDict[measurement.name] = summaryItem;
            }
            summaryItem.ticks.push(parseInt(measurement.ticks, 10));
        }
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const summaryInfo of Object.values(summaryDict)) {
        const size = summaryInfo.ticks.length;
        const average = summaryInfo.ticks.reduce((a, b) => a + b) / size;
        summaryInfo.average = average;
        const deviation =
            summaryInfo.ticks.reduce((prev, next) => {
                return prev + (next - average) ** 2;
            }, 0) / size;
        summaryInfo.deviation = Math.sqrt(deviation);
    }
    console.log(JSON.stringify(summaryDict));
};

main().catch((e) => console.error(e));
