import commandLineArgs from 'command-line-args';
import colors from 'chalk';
import { execSync } from 'child_process';

const options = commandLineArgs([
    { name: 'fix', type: Boolean },
    { name: 'typecheck', type: String },
    { name: 'code', type: Boolean },
    { name: 'prettier', type: Boolean },
    { name: 'files', type: String },
]);

const processCommand = (command: string) => {
    console.log(colors.cyan(`\n👀 ${command}\n`));
    execSync(command, { stdio: 'inherit' });
};

function main() {
    const optionsCount = Object.keys(options).length;
    const shouldRunAll =
        (options.fix && optionsCount === 1) || optionsCount === 0;
    const { typecheck, prettier, code, fix, files } = options;

    if (typecheck !== undefined || shouldRunAll) {
        const project = options.typecheck || 'tsconfig.json';
        const tscCommand = `tsc --project ${project}`;
        processCommand(tscCommand);
    }

    if (prettier || shouldRunAll) {
        const prettierOptions = fix ? '--write --list-different' : '--check';
        const pattern = files || '"./**/*.{ts,js,tsx}"';
        const prettierCommand = `prettier ${prettierOptions} ${pattern}`;
        processCommand(prettierCommand);
    }

    if (code || shouldRunAll) {
        const eslintOptions = ['--cache', ...(fix ? ['--fix'] : [])].join(' ');
        const pattern = files || '.';
        const eslintCommand = `eslint ${eslintOptions} ${pattern}`;
        processCommand(eslintCommand);
    }

    console.log(colors.greenBright('Success!\n'));
}

main();
