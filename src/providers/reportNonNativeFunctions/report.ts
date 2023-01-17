import { flags } from '@inject';
import { DEBUG_CONSOLE_FEATURE } from 'generated/features';
import { noop } from 'src/utils/function/noop';

export const nonNativeFunctionsList: [string, any][] = [];
export const reportNonNativeFunction = flags[DEBUG_CONSOLE_FEATURE]
    ? (fn: any, functionName: string) => {
          nonNativeFunctionsList.push([functionName, fn]);
      }
    : noop;
