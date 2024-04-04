import { isIE } from 'src/utils/browser';
import { clearDefer, setDefer } from 'src/utils/defer';
import { cEvent } from 'src/utils/events';
import { AnyFunc } from 'src/utils//function/types';
import { getMs, TimeOne } from 'src/utils/time';
import { bindArgs } from '../function';

// Это скорректированный таймаут который перезапускает таймер если всякие блюры были
// Потому что таймауты работают фигово, если окно рефокусится и блюрится
// Причём если был блюр, пользовательским временем считается только время после
export function setUserTimeDefer(ctx: Window, callback: AnyFunc, time: number) {
    let id = 0;
    let executedOrCleared = false;
    const destroyTimer = () => {
        clearDefer(ctx, id);
        setEvents(false);
    };

    // В разных версиях IE есть сложности с точным определением состояний с focus и blur окна
    if (isIE(ctx)) {
        id = setDefer(ctx, callback, time, 'u.t.d');
        return bindArgs([ctx, id], clearDefer);
    }

    const timer = TimeOne(ctx);
    let wasBlur = false;
    let wasAction = false;
    let isBlurred = true;
    let addedTime = 0;
    let startTime = timer(getMs);
    const eventsEmitter = cEvent(ctx);

    function onAction() {
        if (!wasAction) {
            wasBlur = true;
            isBlurred = false;
            wasAction = true;
            onCommon();
        }
    }

    function calcTime() {
        if (isBlurred) {
            return addedTime;
        }

        return addedTime + timer(getMs) - startTime;
    }

    function executeCallback() {
        executedOrCleared = true;
        setEvents(false);
        callback();
    }

    function onCommon() {
        clearDefer(ctx, id);
        if (executedOrCleared) {
            setEvents(false);
            return;
        }

        const delta = Math.max(0, time - calcTime());
        if (delta) {
            id = setDefer(ctx, executeCallback, delta, 'u.t.d.c');
        } else {
            executeCallback();
        }
    }

    function onBlur() {
        wasAction = true;
        wasBlur = true;
        isBlurred = true;

        addedTime += timer(getMs) - startTime;
        startTime = timer(getMs);
        onCommon();
    }

    function onFocus() {
        if (!wasBlur && !wasAction) {
            addedTime = 0;
        }

        startTime = timer(getMs);

        wasAction = true;
        wasBlur = true;
        isBlurred = false;
        onCommon();
    }

    function setEvents(add: boolean) {
        const fn = add ? eventsEmitter.on : eventsEmitter.un;
        fn(ctx, ['blur'], onBlur);
        fn(ctx, ['focus'], onFocus);
        fn(ctx.document, ['click', 'mousemove', 'keydown', 'scroll'], onAction);
    }

    setEvents(true);
    onCommon();

    return destroyTimer;
}
