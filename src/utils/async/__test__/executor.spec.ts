import * as chai from 'chai';
import { call, noop } from 'src/utils/function';
import { JSDOMWrapper } from 'src/__tests__/utils/jsdom';
import { iterForOf } from '../iterator';
import { executeIterator, EXEC_TIMEOUT } from '../executor';
import { taskFork } from '../task';

describe('Async Executor', () => {
    const { window } = new JSDOMWrapper();

    it('execIter callTasks async', (done) => {
        let date = 0;
        const restTime = EXEC_TIMEOUT;
        const fn = () => {
            let r = 0;
            for (let i = 0; i < 10000; i += 1) {
                r += Math.random() + i;
            }
            date = new Date().getTime();
            return r;
        };
        const iterator = iterForOf(
            [
                fn,
                fn,
                fn,
                () => {
                    const delta = new Date().getTime() - date;
                    if (delta < restTime) {
                        done(`Too fast! ${delta}`);
                    }
                },
            ],
            call,
        );
        const task = executeIterator(window, iterator, 0);
        task(taskFork(noop, () => done()) as any);
    });
    it('execIter callTasks sync', (done) => {
        let date = 0;
        const restTime = 200;
        const fn = () => {
            let r = 0;
            for (let i = 0; i < 10000; i += 1) {
                r += Math.random() + i;
            }
            return r;
        };
        const iterator = iterForOf(
            [
                fn,
                () => {
                    const delta = new Date().getTime() - date;
                    chai.expect(delta).to.be.gte(restTime);
                    date = new Date().getTime();
                },
                fn,
                () => {
                    const delta = new Date().getTime() - date;
                    chai.expect(delta).to.be.lte(10);
                },
            ],
            call,
        );
        const task = executeIterator(window, iterator, Infinity);
        task(taskFork(noop, () => done()) as any);
    });
});
