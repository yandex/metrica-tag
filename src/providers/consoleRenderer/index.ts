import { flags } from '@inject';
import { providersAsync } from 'src/providersEntrypoint';
import { useConsoleRenderer } from './consoleRenderer';

export const initProvider = () => {
    if (flags.DEBUG_CONSOLE_RENDER_FEATURE) {
        providersAsync.push(useConsoleRenderer);
    }
};
