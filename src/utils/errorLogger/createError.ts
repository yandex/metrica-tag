import { flags } from '@inject';
import { POLYFILLS_FEATURE } from 'generated/features';
import { bindThisForMethodTest, isNativeFunction } from '../function';
import { UNCATCHABLE_ERROR_PROPERTY } from './consts';

export type LoggerError = Error & {
    [UNCATCHABLE_ERROR_PROPERTY]?: boolean;
};
let ErrorConstruct: typeof Error;

const polyError = function PolyError(this: any, errorMessage: string) {
    this.message = errorMessage;
} as unknown as typeof Error;

const createErrorWin =
    (ctx: Window) =>
    (message: string, uncatchable = false) => {
        let error: LoggerError;
        if (ErrorConstruct) {
            error = new ErrorConstruct(message);
        } else if (isNativeFunction('Error', ctx.Error)) {
            ErrorConstruct = ctx.Error;
            error = new ctx.Error(message);
        } else {
            ErrorConstruct = polyError;
            error = new ErrorConstruct(message) as LoggerError;
        }
        if (uncatchable) {
            error[UNCATCHABLE_ERROR_PROPERTY] = true;
        }

        return error;
    };

type httpCtx = {
    status: number;
    statusText: string;
    responseText?: string;
};

export const createError = flags[POLYFILLS_FEATURE]
    ? createErrorWin(window)
    : (message: string, uncatchable = false) => {
          const error = new Error(message) as LoggerError;
          if (uncatchable) {
              error[UNCATCHABLE_ERROR_PROPERTY] = true;
          }

          return error;
      };

export const makeHttpError = (ctx: httpCtx) => {
    const text = `${ctx.responseText}`;
    return createError(
        `http.${ctx.status}.st.${ctx.statusText}.rt.${text.substring(0, 50)}`,
    );
};

export const isHTTPError = bindThisForMethodTest(new RegExp(`^http.`));
