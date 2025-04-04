import * as inject from '@inject';
import * as chai from 'chai';
import { SENDER_COLLECT_FEATURE } from 'generated/features';
import * as sinon from 'sinon';
import * as provider from 'src/providers/clickmap/clickmap';
import * as sender from 'src/sender';
import * as dom from 'src/utils/dom/dom';
import * as cEvent from 'src/utils/events/events';
import type { EventElement } from 'src/utils/events/types';
import type { AnyFunc } from 'src/utils/function/types';
import * as mouseEvents from 'src/utils/mouseEvents/mouseEvents';

import type { SenderInfo } from 'src/sender/SenderInfo';

import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import type { ClickInfo } from 'src/providers/clickmap/type';
import { DEFAULT_COUNTER_TYPE } from 'src/providers/counterOptions';
import * as getCountersUtils from 'src/providers/getCounters/getCounters';

describe('clickmap.ts : ', () => {
    const { window } = new JSDOMWrapper();
    const { MouseEvent } = window;

    describe('isCurrentClickTracked : ', () => {
        const a = window.document.createElement('a');
        const p = window.document.createElement('p');
        const img1 = window.document.createElement('img');
        const div1 = window.document.createElement('div');
        const div2 = window.document.createElement('div');
        const div3 = window.document.createElement('div');

        div3.setAttribute('class', 'ym-disable-clickmap');
        div3.appendChild(div2);
        div2.appendChild(img1);
        div1.appendChild(p);

        it('click with null-element...', () => {
            const currentClick: ClickInfo = {
                element: null,
                position: { x: 0, y: 0 },
                button: 1,
                time: 0,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.false;
        });
        it('custom filter function...', () => {
            const currentClick: ClickInfo = {
                element: p,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = {
                element: div1,
                position: { x: 100, y: 100 },
                button: 1,
                time: 20,
            };
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    (element: HTMLElement) => element.tagName === 'div',
                ),
            ).to.be.false;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    (element: HTMLElement) => element.tagName === 'P',
                ),
            ).to.be.true;
        });
        it('center button link click...', () => {
            const currentClick: ClickInfo = {
                element: a,
                position: { x: 0, y: 0 },
                button: 2,
                time: 100,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.true;
        });
        it('right button link click...', () => {
            const currentClick: ClickInfo = {
                element: a,
                position: { x: 0, y: 0 },
                button: 3,
                time: 100,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.true;
        });
        it('left button link click...', () => {
            const currentClick: ClickInfo = {
                element: a,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.true;
        });
        it('left button link click...', () => {
            const currentClick: ClickInfo = {
                element: p,
                position: { x: 0, y: 0 },
                button: 2,
                time: 100,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.false;
        });
        it('check ignoreTags...', () => {
            const currentClick: ClickInfo = {
                element: p,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = null;
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    ['P'],
                    undefined,
                ),
            ).to.be.false;
        });
        it('near clicks...', () => {
            const currentClick: ClickInfo = {
                element: div1,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = {
                element: div1,
                position: { x: 1, y: 1 },
                button: 1,
                time: 20,
            };
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.false;
        });
        it('ym-disable-clickmap...', () => {
            const currentClick: ClickInfo = {
                element: img1,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = {
                element: div1,
                position: { x: 100, y: 100 },
                button: 1,
                time: 20,
            };
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.false;
        });
        it('two clicks timeout...', () => {
            const currentClick: ClickInfo = {
                element: img1,
                position: { x: 0, y: 0 },
                button: 1,
                time: 100,
            };
            const lastClick: ClickInfo = {
                element: div1,
                position: { x: 100, y: 100 },
                button: 1,
                time: 51,
            };
            chai.expect(
                provider.isCurrentClickTracked(
                    window,
                    currentClick,
                    lastClick,
                    [],
                    undefined,
                ),
            ).to.be.false;
        });
    });

    describe('handleMouseClickEvent : ', () => {
        const sandbox = sinon.createSandbox();
        const pointerLinkResultBaseRe =
            'rn:\\d+:x:-?\\d+:y:-?\\d+:t:\\d+:p:\\w*:X:\\d+:Y:\\d+';
        const pointerLinkWithoutTrackHash = new RegExp(
            `^${pointerLinkResultBaseRe}$`,
        );
        const pointerLinkWithTrackHash = new RegExp(
            `^${pointerLinkResultBaseRe}:wh:1$`,
        );

        const rp0 = window.document.createElement('div');
        const rp1 = window.document.createElement('div');
        const rp2 = window.document.createElement('div');
        const rp3 = window.document.createElement('div');
        const rp4 = window.document.createElement('div');
        const rp5 = window.document.createElement('span');
        const rp6 = window.document.createElement('p');
        const rp7 = window.document.createElement('img');

        rp6.appendChild(rp7);
        rp5.appendChild(rp6);
        rp4.appendChild(rp5);
        rp3.appendChild(rp4);
        rp2.appendChild(rp3);
        rp1.appendChild(rp2);
        rp0.appendChild(rp1);

        const dis1 = window.document.createElement('div');
        const dis2 = window.document.createElement('span');
        dis1.appendChild(dis2);
        dis1.setAttribute('class', 'ym-disable-clickmap');

        let senderOpt: SenderInfo | null = null;
        let useCEventStub: sinon.SinonStub<
            Parameters<typeof cEvent.cEvent>,
            ReturnType<typeof cEvent.cEvent>
        >;
        let useGetTargetStub: sinon.SinonStub<
            Parameters<typeof dom.getTarget>,
            ReturnType<typeof dom.getTarget>
        >;
        let useGetPositionStub: sinon.SinonStub<
            Parameters<typeof mouseEvents.getPosition>,
            ReturnType<typeof mouseEvents.getPosition>
        >;
        let useGetMouseButtonStub: sinon.SinonStub<
            Parameters<typeof mouseEvents.getMouseButton>,
            ReturnType<typeof mouseEvents.getMouseButton>
        >;
        let counterStateGetterStub: sinon.SinonStub<
            Parameters<typeof getCountersUtils.counterStateGetter>,
            ReturnType<typeof getCountersUtils.counterStateGetter>
        >;

        afterEach(() => {
            sandbox.restore();
            senderOpt = null;
        });

        beforeEach(() => {
            sandbox.stub(inject, 'flags').value({
                ...inject.flags,
                [SENDER_COLLECT_FEATURE]: false,
            });
            useGetTargetStub = sandbox.stub(dom, 'getTarget');
            useGetPositionStub = sandbox.stub(mouseEvents, 'getPosition');
            useGetMouseButtonStub = sandbox.stub(mouseEvents, 'getMouseButton');
            sandbox
                .stub(sender, 'getSender')
                .returns((senderInfo: SenderInfo) => {
                    senderOpt = senderInfo;
                    return Promise.resolve('');
                });

            useCEventStub = sandbox.stub(cEvent, 'cEvent');
            useCEventStub.returns({
                on: <T extends string>(
                    elem: EventElement,
                    events: T[],
                    handler: AnyFunc,
                ) => {
                    const [name] = events;
                    if (name === 'click') {
                        handler(new MouseEvent('click', { view: window }));
                    }
                    return () => {};
                },
                un: () => {},
            });
            counterStateGetterStub = sandbox.stub(
                getCountersUtils,
                'counterStateGetter',
            );
        });

        it('with hash tracking', () => {
            useGetTargetStub.returns(rp1);
            useGetPositionStub.returns({ x: 100, y: 100 });
            useGetMouseButtonStub = useGetMouseButtonStub.returns(1);
            counterStateGetterStub.returns(() => ({
                clickmap: {
                    isTrackHash: true,
                },
            }));
            provider.useClickMapProviderBase(window, {
                id: 111,
                counterType: DEFAULT_COUNTER_TYPE,
            });

            const pointerLinkParam = senderOpt!.urlParams!['pointer-click'];
            chai.expect(pointerLinkWithTrackHash.test(pointerLinkParam)).to.be
                .true;
        });
        it('without hash tracking', () => {
            useGetTargetStub.returns(rp1);
            useGetPositionStub.returns({ x: 100, y: 100 });
            useGetMouseButtonStub = useGetMouseButtonStub.returns(1);
            counterStateGetterStub.returns(() => ({
                clickmap: {},
            }));
            provider.useClickMapProviderBase(window, {
                id: 111,
                counterType: DEFAULT_COUNTER_TYPE,
            });

            const pointerLinkParam = senderOpt!.urlParams!['pointer-click'];
            chai.expect(pointerLinkWithoutTrackHash.test(pointerLinkParam)).to
                .be.true;
        });
        it('real path check', () => {
            useGetTargetStub.returns(rp7);
            useGetPositionStub.returns({ x: 100, y: 100 });
            useGetMouseButtonStub.returns(1);
            counterStateGetterStub.returns(() => ({
                clickmap: {
                    quota: 3,
                },
            }));
            const expectedRealPath = 'OSWAAAA';
            provider.useClickMapProviderBase(window, {
                id: 111,
                counterType: DEFAULT_COUNTER_TYPE,
            });

            const pointerLinkParam = senderOpt!.urlParams!['pointer-click'];
            chai.expect(pointerLinkWithoutTrackHash.test(pointerLinkParam)).to
                .be.true;
            const realpath = pointerLinkParam.split(':')[9];
            chai.expect(realpath === expectedRealPath).to.be.true;
        });
        it('ignored tags', () => {
            useGetTargetStub.returns(rp7);
            useGetPositionStub.returns({ x: 100, y: 100 });
            useGetMouseButtonStub.returns(1);
            counterStateGetterStub.returns(() => ({
                clickmap: {
                    ignoreTags: ['iMg'],
                },
            }));
            provider.useClickMapProviderBase(window, {
                id: 111,
                counterType: DEFAULT_COUNTER_TYPE,
            });

            chai.expect(senderOpt).to.be.null;
        });
        it('quota check', () => {
            const quota = 10;
            useCEventStub.restore();
            useCEventStub = sandbox.stub(cEvent, 'cEvent');
            useCEventStub.returns({
                on: <T extends string>(
                    elem: EventElement,
                    events: T[],
                    handler: AnyFunc,
                ) => {
                    const [name] = events;
                    if (name === 'click') {
                        const useIsCurrentClickTrackedStub = sinon.stub(
                            provider,
                            'isCurrentClickTracked',
                        );
                        useIsCurrentClickTrackedStub.returns(true);
                        for (let q = 0; q <= quota; q += 1) {
                            handler(new MouseEvent('click', { view: window }));
                            if (q < quota) {
                                const pointerLinkParam =
                                    senderOpt!.urlParams!['pointer-click'];
                                chai.expect(
                                    pointerLinkWithoutTrackHash.test(
                                        pointerLinkParam,
                                    ),
                                ).to.be.true;
                            } else {
                                chai.expect(senderOpt).to.be.null;
                            }
                            senderOpt = null;
                        }
                        useIsCurrentClickTrackedStub.restore();
                    }
                    return () => {};
                },
                un: () => {},
            });

            useGetTargetStub.returns(rp7);
            useGetPositionStub.returns({ x: 100, y: 100 });
            useGetMouseButtonStub.returns(1);
            counterStateGetterStub.returns(() => ({
                clickmap: {
                    quota,
                },
            }));
            provider.useClickMapProviderBase(window, {
                id: 111,
                counterType: DEFAULT_COUNTER_TYPE,
            });
        });
    });
});
