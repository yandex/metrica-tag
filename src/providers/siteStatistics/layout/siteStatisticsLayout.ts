import { getElemCreateFunction } from 'src/utils/dom';
import { cEvent } from 'src/utils/events';
import { getPath, mix } from 'src/utils/object';
import { cForEach, cReduce } from 'src/utils/array';
import { bind, bindArgs, bindArg, call, noop } from 'src/utils/function';
import { stringIndexOf } from 'src/utils/string';

const positionAbsolute = { position: 'absolute' };
const positionFixed = { position: 'fixed' };
const circleRadius = { borderRadius: '50%' };

export const boxStyles = (width: string, height?: string) => ({
    ['width']: width,
    ['height']: height || width,
});

export const getStyles = (props: string[], value: string) =>
    cReduce<string, Record<string, string>>(
        (acc, prop) => {
            acc[prop] = value;
            return acc;
        },
        {},
        props,
    );

export const siteStatisticsLayout = (ctx: Window, counterId: number) => {
    const FRAME_WIDTH = 600;
    const WV_IGNORE = '__ym_wv_ign';
    const metrikaHost = 'https://metrika.yandex.ru';

    const createElement = getElemCreateFunction(ctx);

    if (!createElement) {
        return noop;
    }

    const createDiv = bindArg('div', createElement) as (
        options?: ElementCreationOptions | undefined,
    ) => HTMLDivElement;
    const createIframe = bindArg('iframe', createElement) as (
        options?: ElementCreationOptions | undefined,
    ) => HTMLIFrameElement;

    const crateBar = (
        offset: number,
        width: number,
        height: number,
        color: string,
        borderTopLeftRadius?: string,
    ) => {
        const bar = createDiv();

        mix(
            bar.style,
            boxStyles(`${width}px`, `${height}px`),
            positionAbsolute,
            {
                left: `${offset}px`,
                bottom: 0,
                background: color,
                borderTopLeftRadius,
            },
        );

        return bar;
    };

    const createLine = (rotate: number) => {
        const line = createDiv();

        mix(line.style, boxStyles('2px', '18px'), positionAbsolute, {
            left: '15px',
            top: '7px',
            background: '#2f3747',
            borderRadius: '2px',
        });
        line.style.transform = `rotate(${rotate}deg)`;

        return line;
    };

    const layout = createDiv();
    layout.classList.add(WV_IGNORE);
    mix(layout.style, positionFixed, {
        bottom: '0',
        width: '100%',
        maxWidth: 'initial',
        zIndex: '999999999',
    });
    const layoutContainer = layout.attachShadow
        ? layout.attachShadow({ mode: 'open' })
        : layout;

    const logo = createDiv();
    mix(logo.style, boxStyles('24px'), positionAbsolute, circleRadius, {
        top: '12px',
        right: '10px',
        background: '#3367dc',
        overflow: 'hidden',
    });

    const spinnerAnimation = `${WV_IGNORE}-spinner-animation`;
    const spinner = createDiv();
    mix(
        spinner.style,
        {
            border: '2px solid transparent',
            animation: `${spinnerAnimation} 1s 0.21s infinite linear`,
        },
        circleRadius,
        positionAbsolute,
        boxStyles('48px'),
        getStyles(['top', 'left'], 'calc(50% - 24px)'),
        getStyles(['borderTopColor', 'borderLeftColor'], '#fc0'),
    );
    const animationStyle = createElement('style');
    animationStyle.textContent = `@keyframes ${spinnerAnimation} {to {transform: rotate(360deg);}}`;
    spinner.appendChild(animationStyle);

    const opener = createDiv();
    opener.id = `${WV_IGNORE}__opener`;
    mix(opener.style, boxStyles('46px', '48px'), positionFixed, {
        right: '0',
        bottom: '60px',
        cursor: 'pointer',
        background: '#fff',
        borderRadius: '16px 0 0 16px',
        boxShadow:
            '0px 0px 1px rgba(67, 68, 69, 0.3), 0px 1px 2px rgba(67, 68, 69, 0.3)',
    });

    const frame = createDiv();
    mix(
        frame.style,
        positionAbsolute,
        getStyles(['top', 'right', 'bottom'], '0'),
        {
            width: `${FRAME_WIDTH}px`,
            background: '#fff',
        },
    );

    const close = createDiv();
    close.id = `${WV_IGNORE}__closer`;
    mix(close.style, boxStyles('32px'), positionAbsolute, circleRadius, {
        top: '12px',
        right: `${FRAME_WIDTH + 12}px`,
        cursor: 'pointer',
        background: '#fff',
    });

    const iframeCheck = createIframe();
    iframeCheck.src = `${metrikaHost}/widget/iframe-check`;

    const iframe = createIframe();
    mix(iframe.style, boxStyles('100%'), {
        border: 'none',
    });

    iframe.src = `${metrikaHost}/widget/dashboard?id=${counterId}`;
    frame.hidden = true;
    close.hidden = true;

    close.appendChild(createLine(45));
    close.appendChild(createLine(-45));

    frame.appendChild(iframeCheck);

    logo.appendChild(
        crateBar(
            0,
            8,
            9,
            'linear-gradient(0deg, #ff324f, #ff324f), linear-gradient(158.67deg, #ff455c 12.6%, #ff1139 96.76%)',
        ),
    );
    logo.appendChild(crateBar(8, 9, 16, '#04acff', '3px'));
    logo.appendChild(crateBar(17, 7, 24, '#ffdd13'));

    opener.appendChild(logo);
    layoutContainer.appendChild(frame);
    layoutContainer.appendChild(close);

    const EVENTS = ['click', 'touchstart'] as const;

    const handler = () => {
        if (opener.hidden) {
            mix(
                layout.style,
                getStyles(['top', 'right', 'left', 'background'], 'initial'),
            );
        } else {
            mix(layout.style, getStyles(['top', 'right', 'left'], '0'), {
                background: 'rgba(0, 0, 0, .3)',
            });
        }

        if (!iframe.parentNode) {
            frame.appendChild(spinner);
            frame.appendChild(iframe);
        }

        opener.hidden = !opener.hidden;
        frame.hidden = !frame.hidden;
        close.hidden = !close.hidden;
    };

    const windowEventWrapper = cEvent(ctx);
    const { body } = ctx.document;

    const unsubscribers = [
        windowEventWrapper.on(opener, EVENTS, handler),
        windowEventWrapper.on(close, EVENTS, handler),
        windowEventWrapper.on(
            iframeCheck,
            ['load'],
            bindArgs(
                [
                    call,
                    [
                        bind(frame.removeChild, frame, iframeCheck),
                        bind(
                            layoutContainer.appendChild,
                            layoutContainer,
                            opener,
                        ),
                    ],
                ],
                cForEach,
            ),
        ),
        windowEventWrapper.on(
            iframe,
            ['load'],
            bind(frame.removeChild, frame, spinner),
        ),
        bind(body.removeChild, body, layout),
    ];
    const destruct = bindArgs([call, unsubscribers], cForEach);

    unsubscribers.push(
        windowEventWrapper.on(
            ctx,
            ['securitypolicyviolation'],
            (event: SecurityPolicyViolationEvent) => {
                const blockedURI = getPath(event, 'blockedURI');

                if (blockedURI && stringIndexOf(blockedURI, metrikaHost) >= 0) {
                    destruct();
                }
            },
        ),
    );

    body.appendChild(layout);

    return destruct;
};
