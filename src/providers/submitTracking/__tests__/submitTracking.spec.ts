import * as chai from 'chai';
import sinon from 'sinon';
import {
    handleClick,
    log,
    submit,
    useSubmitTracking,
} from 'src/providers/submitTracking/submitTracking';
import { CounterOptions } from 'src/utils/counterOptions';
import * as asyncMap from 'src/utils/asyncMap';
import * as domUtils from 'src/utils/dom';
import * as goalProvider from 'src/providers/goal/goal';
import * as deferUtils from 'src/utils/defer';
import * as functionUtils from 'src/utils/function';
import * as errorLoggerUtils from 'src/utils/errorLogger';
import * as eventUtils from 'src/utils/events';
import * as counterSettingUtils from 'src/utils/counterSettings';
import * as counterOptionsUtils from 'src/utils/counterOptions';
import { ID, NAME, PATH } from 'src/utils/dom';
import * as formUtils from 'src/utils/dom/form';
import * as debugConsole from 'src/providers/debugConsole/debugConsole';
import { METHOD_NAME_GOAL } from 'src/providers/goal/const';
import { CounterSettings } from 'src/utils/counterSettings';

describe('submitTracking', () => {
    const win = {
        Array: window.Array,
    } as Window;
    const sandbox = sinon.createSandbox();
    const button = {
        nodeName: 'BUTTON',
        type: 'submit',
    } as any as HTMLFormElement;
    let form: HTMLFormElement;

    const div = {
        nodeName: 'DIV',
    } as any as HTMLDivElement;

    let sendGoalSpy: sinon.SinonSpy;
    let setDeferStub: sinon.SinonStub<
        Parameters<typeof deferUtils.setDefer>,
        ReturnType<typeof deferUtils.setDefer>
    >;
    let cEventSpy: sinon.SinonSpy;
    let counterSettingsStorageStub: sinon.SinonStub<
        Parameters<typeof counterSettingUtils.getCounterSettings>,
        ReturnType<typeof counterSettingUtils.getCounterSettings>
    >;
    let logFnSpy: sinon.SinonSpy;

    const FORM_ID = 'searchFormId';
    const FORM_NAME = 'searchFormName';
    const FORM_PATH = 'F';

    beforeEach(() => {
        sendGoalSpy = sandbox.spy();
        sandbox.stub(formUtils, 'getFormData').returns({
            [ID]: FORM_ID,
            [NAME]: FORM_NAME,
            [PATH]: FORM_PATH,
        } as ReturnType<typeof formUtils.getFormData>);

        form = {
            nodeName: 'FORM',
        } as any as HTMLFormElement;
        sandbox
            .stub(goalProvider, 'useGoal')
            .callsFake((ctx, counterOptions, goal, logGoals) => {
                if (logGoals) {
                    logGoals();
                }
                return { [METHOD_NAME_GOAL]: sendGoalSpy };
            });
        setDeferStub = sandbox.stub(deferUtils, 'setDefer');
        sandbox.stub(functionUtils, 'bindArgs').callsFake((args, fn) => fn);
        sandbox
            .stub(errorLoggerUtils, 'errorLogger')
            .callsFake((a, b, c) => c!);
        sandbox.stub(errorLoggerUtils, 'ctxErrorLogger').callsFake((a, b) => b);
        cEventSpy = sandbox.spy();
        sandbox.stub(eventUtils, 'cEvent').returns({
            on: cEventSpy,
        } as unknown as eventUtils.EventSetter);

        logFnSpy = sandbox.spy();
        sandbox.stub(debugConsole, 'getLoggerFn').returns(logFnSpy);

        counterSettingsStorageStub = sandbox.stub(
            counterSettingUtils,
            'getCounterSettings',
        );
        counterSettingsStorageStub.callsFake((_, fn) =>
            Promise.resolve(fn({} as CounterSettings)),
        );

        sandbox.stub(counterOptionsUtils, 'getCounterKey');
    });
    afterEach(() => {
        sandbox.restore();
    });

    it('submit - force', () => {
        submit(true, win, {} as CounterOptions, [], form);
        sinon.assert.calledWith(
            sendGoalSpy,
            `?i=${FORM_ID}&n=${FORM_NAME}&p=${FORM_PATH}`,
        );
    });

    it('submit - after click without submit event', () => {
        submit(false, win, {} as CounterOptions, [form], form);
        sinon.assert.calledWith(
            sendGoalSpy,
            `?i=${FORM_ID}&n=${FORM_NAME}&p=${FORM_PATH}`,
        );
    });

    it('submit - after click with submit event', () => {
        submit(false, win, {} as CounterOptions, [], form);
        sinon.assert.notCalled(sendGoalSpy);
    });

    it('handleClick - form', () => {
        sandbox.stub(domUtils, 'closest').returns(button);

        sandbox.stub(formUtils, 'closestForm').returns(form);

        const awaitForms = [] as HTMLFormElement[];
        handleClick(win, {} as CounterOptions, awaitForms, {
            target: button,
        } as any as MouseEvent);
        sinon.assert.calledOnce(setDeferStub);
        chai.expect(awaitForms[0]).to.eq(form);
    });

    it('handleClick - div', () => {
        const awaitForms = [] as HTMLFormElement[];
        handleClick(win, {} as CounterOptions, awaitForms, {
            target: div,
        } as any as MouseEvent);
        sinon.assert.notCalled(setDeferStub);
        chai.expect(awaitForms.length).to.eq(0);
    });

    it('useSubmitTracking', () => {
        useSubmitTracking(win, {} as CounterOptions);
        let [target, events, handler] = cEventSpy.getCall(0).args;
        chai.expect(target).to.equal(win);
        chai.expect(events).to.deep.equal(['click']);
        chai.expect(handler).to.equal(handleClick);

        [target, events, handler] = cEventSpy.getCall(1).args;
        chai.expect(target).to.equal(win);
        chai.expect(events).to.deep.equal(['submit']);
    });

    it('log', () => {
        // NOTE: Can't stub getCounterSettings here, so stub its internals instead.
        let getAsyncStub: sinon.SinonStub<
            Parameters<typeof asyncMap.getAsync>,
            ReturnType<typeof asyncMap.getAsync>
        >;

        beforeEach(() => {
            getAsyncStub = sandbox.stub(asyncMap, 'getAsync');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should log', async () => {
            getAsyncStub.resolves({
                settings: {
                    ['form_goals']: 1,
                },
            });
            const message = 'message';
            await log(win, {} as CounterOptions, message);
            sinon.assert.calledOnce(logFnSpy);
        });

        it('should not log', async () => {
            getAsyncStub.resolves({});
            await log(win, {} as CounterOptions, 'message');
            sinon.assert.notCalled(logFnSpy);
        });
    });
});
