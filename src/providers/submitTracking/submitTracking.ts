import { ctxErrorLogger, errorLogger } from 'src/utils/errorLogger';
import { cEvent } from 'src/utils/events';
import {
    bindArgs,
    call,
    curry2SwapArgs,
    memo,
    noop,
    pipe,
    secondArg,
} from 'src/utils/function';
import { cIndexOf } from 'src/utils/array';
import { ctxPath, getPath, isNil } from 'src/utils/object';
import { setDefer } from 'src/utils/defer';
import { CounterOptions } from 'src/utils/counterOptions';
import { useGoal } from 'src/providers/goal/goal';
import { CounterSettings, getCounterSettings } from 'src/utils/counterSettings';
import { stringify } from 'src/utils/querystring';
import { closestForm, getFormData } from 'src/utils/dom/form';
import { getLoggerFn } from 'src/providers/debugConsole/debugConsole';
import { closest } from 'src/utils/dom';
import { ternary } from 'src/utils/condition';
import { toZeroOrOne } from 'src/utils/boolean';
import { METHOD_NAME_GOAL } from '../goal/const';
import { INTERNAL_PARAMS_KEY, IS_TRUSTED_EVENT_KEY } from '../params/const';

const CLICK_DELAY = 300;

const shouldLogCheck: (
    ctx: Window,
    counterOptions: CounterOptions,
) => Promise<boolean> = memo(
    pipe(
        secondArg,
        curry2SwapArgs(getCounterSettings)(
            ctxPath('settings.form_goals') as (
                counterOptions: CounterSettings,
            ) => boolean,
        ),
    ),
    secondArg,
);

export const log = (
    ctx: Window,
    counterOptions: CounterOptions,
    message: string,
) =>
    shouldLogCheck(ctx, counterOptions).then(
        pipe(
            bindArgs(
                [getLoggerFn(ctx, counterOptions, message), noop],
                ternary,
            ),
            call,
        ),
    );

export const handleSubmit = (
    force: boolean,
    ctx: Window,
    counterOptions: CounterOptions,
    awaitSubmitForms: HTMLFormElement[],
    form: HTMLFormElement,
    isEventTrusted?: boolean | null,
) => {
    const formIndex = cIndexOf(ctx)(form, awaitSubmitForms);
    const hasForm = formIndex !== -1;

    if (force || hasForm) {
        if (hasForm) {
            awaitSubmitForms.splice(formIndex, 1);
        }

        const data = getFormData(ctx, form);

        const query = `?${stringify(data)}`;

        const logGoals = bindArgs(
            [
                ctx,
                counterOptions,
                `Form goal. Counter ${counterOptions.id}. Form: ${query}.`,
            ],
            log,
        );

        let rawParams: Record<string, unknown> | undefined;
        if (isNil(isEventTrusted)) {
            rawParams = undefined;
        } else {
            rawParams = {
                [INTERNAL_PARAMS_KEY]: {
                    [IS_TRUSTED_EVENT_KEY]: toZeroOrOne(isEventTrusted),
                },
            };
        }

        useGoal(ctx, counterOptions, 'form', logGoals)[METHOD_NAME_GOAL](
            query,
            rawParams,
        );
    }
};

export const handleClick = (
    ctx: Window,
    counterOptions: CounterOptions,
    awaitSubmitForms: HTMLFormElement[],
    event: MouseEvent,
) => {
    const target = getPath(event, 'target') as HTMLElement | null;
    if (!target) {
        return;
    }
    const isTrustedEvent = getPath(event, 'isTrusted');
    const button = closest('button,input', ctx, target) as
        | HTMLButtonElement
        | HTMLInputElement
        | null;

    if (button && button.type === 'submit') {
        const form = closestForm(ctx, button) as HTMLFormElement | null;
        if (form) {
            awaitSubmitForms.push(form);

            setDefer(
                ctx,
                bindArgs(
                    [
                        false,
                        ctx,
                        counterOptions,
                        awaitSubmitForms,
                        form,
                        isTrustedEvent,
                    ],
                    handleSubmit,
                ),
                CLICK_DELAY,
            );
        }
    }
};

/**
 * Tracks form submissions
 * @param ctx - Current window
 * @param counterOptions - Counter options on initialization
 */
export const useSubmitTracking = ctxErrorLogger(
    's.f.i',
    (ctx: Window, counterOptions: CounterOptions) => {
        const awaitSubmitForms: HTMLFormElement[] = [];

        cEvent(ctx).on(
            ctx,
            ['click'],
            errorLogger(
                ctx,
                's.f.c',
                bindArgs([ctx, counterOptions, awaitSubmitForms], handleClick),
            ),
        );

        cEvent(ctx).on(
            ctx,
            ['submit'],
            errorLogger(ctx, 's.f.e', (event) => {
                const target = getPath(event, 'target');
                const isTrustedEvent = getPath(event, 'isTrusted');
                handleSubmit(
                    true,
                    ctx,
                    counterOptions,
                    awaitSubmitForms,
                    target,
                    isTrustedEvent,
                );
            }),
        );

        log(
            ctx,
            counterOptions,
            `Form goal. Counter ${counterOptions.id}. Init.`,
        );
    },
);
