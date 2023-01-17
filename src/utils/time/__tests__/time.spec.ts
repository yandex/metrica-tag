import * as eventUtils from 'src/utils/events';
import * as chai from 'chai';
import * as sinon from 'sinon';
import {
    getFromStart,
    getMin,
    getMs,
    getSec,
    getTimestamp,
    getTimezone,
    Time,
} from '../time';

describe('Time', () => {
    const sandbox = sinon.createSandbox();
    const eventStub: any = {
        on: sinon.stub(),
    };
    beforeEach(() => {
        sandbox.stub(eventUtils, 'cEvent').returns(eventStub);
    });
    afterEach(() => {
        eventStub.on.resetHistory();
        sandbox.restore();
    });

    it('get ms from perfomance and sets unload time', () => {
        let now = 100;
        const ctx: any = {
            performance: {
                now: () => now,
                timing: {
                    navigationStart: 0,
                },
            },
        };
        const time = Time(ctx);
        const [target, events, callback] = eventStub.on.getCall(0).args;

        const ms = time(getMs);
        chai.expect(ms).to.equal(now);
        now = 300;

        chai.expect(target).to.equal(ctx);
        chai.expect(events).to.deep.equal(['beforeunload', 'unload']);
        callback();

        now = 400;

        const msUnload = time(getMs);
        chai.expect(msUnload).to.equal(300);
    });
    it('get ms from Date now', () => {
        const now = 100;
        const ctx: any = {
            Date: { now: () => now },
            timing: {
                navigationStart: 0,
            },
        };
        const time = Time(ctx);
        chai.expect(time(getMs)).to.equal(now);
    });
    it('get ms from new Date ', () => {
        const ms = 10000;
        const timezone = 100;
        const year = 2000;
        const month = 11;
        const day = 2;
        const hours = 7;
        const minutes = 13;
        let seconds = 10;
        const ctx: any = {
            timing: {
                navigationStart: 0,
            },
            Date: class Date {
                getTime() {
                    return ms;
                }

                getTimezoneOffset() {
                    return timezone;
                }

                getFullYear() {
                    return year;
                }

                getMonth() {
                    return month;
                }

                getDate() {
                    return day;
                }

                getHours() {
                    return hours;
                }

                getMinutes() {
                    return minutes;
                }

                getSeconds() {
                    return seconds;
                }
            },
        };

        const time = Time(ctx);
        chai.expect(time(getMs)).to.be.equal(ms);
        chai.expect(time(getTimezone)).to.be.equal(-timezone);
        chai.expect(time(getMin)).to.be.equal(Math.floor(ms / 1000 / 60));
        chai.expect(time(getSec)).to.be.equal(Math.floor(ms / 1000));
        chai.expect(time(getFromStart)).to.be.equal(0);
        chai.expect(time(getTimestamp)).to.be.equal(
            `${year}${month + 1}0${day}0${hours}${minutes}${seconds}`,
        );
        seconds = 9;
        chai.expect(time(getTimestamp)).to.be.equal(
            `${year}${month + 1}0${day}0${hours}${minutes}0${seconds}`,
        );
    });
});
