import {
    spawn,
    fork,
    ForkOptions,
    SpawnOptions,
    ChildProcess,
} from 'child_process';
import psTree from 'ps-tree';
import colors from 'chalk';

const handler = (print = false, procName: string, chunk: Buffer) => {
    const date = new Date().toISOString().split('T')[1];
    if (print) {
        process.stdout.write(`${date}:${procName} - ${chunk.toString('utf8')}`);
    }
};

export type ProcessOptions = {
    procName?: string;
    console?: boolean | { stdout: boolean; stderr: boolean };
    fork?: boolean;
} & SpawnOptions &
    ForkOptions;

type ChildProcessPromise = Promise<string> & {
    cp: ChildProcess;
};

type Args =
    | [string, (readonly string[])?, ProcessOptions?]
    | [string, ProcessOptions?];

export function spawnAsPromised(...args: Args): ChildProcessPromise {
    let opt: ProcessOptions = {};

    if (args.length === 2 && !Array.isArray(args[1])) {
        opt = (args[1] || {}) as ProcessOptions;
    } else {
        opt = args[2] || {};
    }

    const { console: print, fork: forkOpt } = opt;
    const stdioInherit = opt.stdio === 'inherit';
    const realProcessName = args[0];
    const procName = opt.procName || realProcessName;
    const cp = forkOpt
        ? fork(realProcessName, ...(args.slice(1) as any))
        : spawn(realProcessName, ...(args.slice(1) as any));
    let stdout = '';
    const boundHandler = handler.bind(null, !!print, procName);
    const out = new Promise<string>((resolve, reject) => {
        const stdioExists = cp.stdout && cp.stderr;

        if (!stdioExists && !stdioInherit && !forkOpt) {
            console.log(colors.yellow(`Warning: Stdout is empty ${args[0]}`));
        }

        if (print && stdioInherit) {
            console.log(
                colors.yellow(
                    'Warning: Cannot log to console if stdio is set to "inherit"',
                ),
            );
        }

        cp.on('error', (e: Error) => {
            console.error(e);
            reject(e);
        }).on('close', (code: number) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(code);
            }
        });

        if (stdioExists) {
            cp.stdout!.on('data', (chunk: Buffer) => {
                if (typeof print !== 'object' || print.stdout) {
                    boundHandler(chunk);
                }
                stdout += chunk;
            });
            cp.stderr!.on('data', (chunk: Buffer) => {
                if (typeof print !== 'object' || print.stderr) {
                    boundHandler(chunk);
                }
            });
        }
    }) as ChildProcessPromise;

    out.cp = cp;
    return out;
}

export type FailedCommandData = {
    exitCode?: number;
    commandName?: string;
};

export function processCommands(
    commands: (Args | string | null)[],
    i = 0,
    shouldLog = true,
): Promise<void | FailedCommandData> {
    if (i < commands.length) {
        let command = commands[i];
        let message: string;

        if (!command) {
            return processCommands(commands, i + 1, shouldLog);
        }

        if (typeof command === 'string') {
            message = command;
            command = [command, { stdio: 'inherit' }];
        } else {
            const processArgs = command[1] instanceof Array ? command[1] : [];
            message = `${command[0]} ${processArgs.join(' ')}`;
        }

        if (shouldLog) {
            console.log(colors.cyan(`\n> ${message}\n`));
        }

        return spawnAsPromised(...command).then(
            () => processCommands(commands, i + 1, shouldLog),
            (exitCode: number) =>
                // eslint-disable-next-line prefer-promise-reject-errors
                Promise.reject({ exitCode, commandName: message }),
        );
    }

    return Promise.resolve();
}

export const killFn = (cp: ChildProcess) => (cb?: (...args: any[]) => any) => {
    psTree(cp.pid!, (err, children) => {
        spawn('kill', ['-9', ...children.map((p) => String(p.PID))]);
        cp.kill();
        if (typeof cb === 'function') {
            cb();
        }
    });
};
