import commandLineArgs from 'command-line-args';
import colors from 'chalk';
import { processCommands, FailedCommandData } from './utils/proc';

const options = commandLineArgs([
    { name: 'fix', type: Boolean },
    { name: 'typecheck', type: Boolean },
    { name: 'code', type: Boolean },
    { name: 'prettier', type: Boolean },
    { name: 'files', type: String },
]);

const commands = (files: string, fix: boolean) => ({
    typecheck: 'tsc',
    prettier: `prettier ${fix ? '--write --list-different' : '--check'} ${
        files || '"./**/*.{ts,js,tsx}"'
    }`,
    code: `npm run code-linter -- ${fix ? '--fix' : ''} ${files || '.'}`,
});

async function main() {
    const optionsCount = Object.keys(options).length;
    const shouldRunAll =
        (options.fix && optionsCount === 1) || optionsCount === 0;
    const commandsMap = commands(options.files, options.fix);
    const commandsToExecute = Object.entries(commandsMap)
        .filter(([key, command]) => options[key] || shouldRunAll)
        .map(([key, command]) => command);

    await processCommands(commandsToExecute).catch(
        ({ exitCode }: FailedCommandData = {}) => {
            if (exitCode) {
                process.exit(exitCode);
            }
        },
    );

    console.log(colors.greenBright('Success!\n'));
}

main();
