import { flags } from '@inject';
import { providersAsync } from 'src/providersEntrypoint';
import { DEBUG_CONSOLE_RENDER_FEATURE } from 'generated/features';
import { useConsoleRenderer } from './consoleRenderer';

export const initProvider = () => {
    if (flags[DEBUG_CONSOLE_RENDER_FEATURE]) {
        providersAsync.push(useConsoleRenderer);
    }
};
