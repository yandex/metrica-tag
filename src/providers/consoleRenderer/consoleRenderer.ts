import { dataLayerObserver } from 'src/utils/dataLayerObserver';
import { getConsole } from 'src/utils/console';
import { ctxErrorLogger } from 'src/utils/errorLogger';
import { cMap } from 'src/utils/array';
import { has } from 'src/utils/object';
import { isString } from 'src/utils/string';
import { globalMemoWin } from 'src/utils/function';
import { getEvents } from 'src/utils/debugEvents';
import { CONSOLE_DICTIONARY, variableRegex } from './dictionary';

export const getMessage = (
    messageID: string,
    variables?: Record<string, string | number>,
) => {
    let template = CONSOLE_DICTIONARY[messageID];
    if (!template) {
        return messageID;
    }

    if (!variables) {
        return template;
    }

    variableRegex.lastIndex = 0;
    let match = variableRegex.exec(template);
    while (match) {
        const [, variableName] = match;
        if (has(variables, variableName)) {
            const value = variables[variableName];
            const length = variableName.length + 2;
            const { index } = match;

            template = `${template.substring(
                0,
                index,
            )}${value}${template.substring(index + length, template.length)}`;
            variableRegex.lastIndex = length + index;
        }
        match = variableRegex.exec(template);
    }

    return template;
};

export const useConsoleRendererRaw = (ctx: Window) => {
    const debuggerEvents = getEvents(ctx);
    const console = getConsole(ctx);
    dataLayerObserver(ctx, debuggerEvents, (observer) => {
        observer.observer.on((event) => {
            if (event['name'] !== 'log') {
                return;
            }

            const args = cMap((arg) => {
                if (isString(arg)) {
                    return getMessage(arg, event['data']['variables']);
                }

                return arg;
            }, event['data']['args']);
            console[event['data']['type']](...args);
        });
    });
};

export const useConsoleRenderer = ctxErrorLogger(
    'cr',
    globalMemoWin('conr', useConsoleRendererRaw),
);
