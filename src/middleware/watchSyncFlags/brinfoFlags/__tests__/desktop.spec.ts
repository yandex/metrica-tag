import * as chai from 'chai';
import { BatteryManager, getDesktopFlag } from '../desktop';

describe('getDesktopFlag', () => {
    let promise: Promise<BatteryManager | void>;
    let win: Window;

    const testCase =
        (expectedResult: number, getBatteryResult?: BatteryManager) =>
        (done: Mocha.Done) => {
            if (getBatteryResult) {
                promise = Promise.resolve(getBatteryResult);
                win = {
                    navigator: {
                        getBattery: () => promise,
                    },
                } as unknown as Window;
            }

            const result = getDesktopFlag(win);
            chai.expect(result).to.be.equal(0);

            if (getBatteryResult) {
                promise.then(() => {
                    const newResult = getDesktopFlag(win);
                    chai.expect(newResult).to.be.equal(expectedResult);
                    done();
                });
            } else {
                const newResult = getDesktopFlag(win);
                chai.expect(newResult).to.be.equal(expectedResult);
                done();
            }
        };

    beforeEach(() => {
        promise = Promise.resolve();
        win = {
            navigator: {},
        } as Window;
    });

    it('responds with "0" if "getBattery" not in "navigator"', testCase(0));

    it(
        'responds with "0" if not charging',
        testCase(0, {
            charging: false,
            chargingTime: 0,
        }),
    );

    it(
        'responds with "0" if charging with non-zero chargingTime',
        testCase(0, {
            charging: true,
            chargingTime: 1,
        }),
    );

    it(
        'responds with "1" if charging with zero chargingTime',
        testCase(1, {
            charging: true,
            chargingTime: 0,
        }),
    );
});
