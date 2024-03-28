import * as chai from 'chai';
import { noop } from 'src/utils/function';
import {
    task,
    taskFork,
    taskMap,
    taskOf,
    taskChain,
    taskAll,
    fromPromise,
    taskRace,
} from '../task';

describe('task', () => {
    it('transforms from promise', (done) => {
        let resolve: Function = () => {};
        const testResult = 123123;
        const promise = new Promise((pResolve) => {
            resolve = pResolve;
        });
        const taskFn = fromPromise(promise);
        taskFn(
            taskFork(noop, (result) => {
                chai.expect(result).to.be.eq(testResult);
                done();
            }),
        );
        resolve(testResult);
    });
});

describe('taskRace', () => {
    const taskThatDoesNothing = () =>
        task(() => {
            // do nothing
        });
    const taskThatFails = (error: any) =>
        task((reject) => {
            reject(error);
        });
    const taskThatResolves = (result: any) =>
        task((reject, resolve) => {
            resolve(result);
        });

    it('resolves raceTasks', (done) => {
        const res1 = {};
        const res2 = {};
        taskRace([
            taskThatFails(new Error()),
            taskThatDoesNothing(),
            taskThatResolves(res1),
            taskThatDoesNothing(),
            taskThatResolves(res2),
        ])(
            taskFork(noop, (result) => {
                chai.expect(result).to.be.eq(res1);
                done();
            }),
        );
    });

    it('rejects raceTasks', (done) => {
        const error1 = new Error();
        const error2 = new Error();
        const error3 = new Error();
        taskRace([
            taskThatFails(error1),
            taskThatFails(error2),
            taskThatFails(error3),
        ])(
            taskFork((error) => {
                chai.expect(error).to.deep.equal([error1, error2, error3]);
                done();
            }, noop),
        );
    });
});

describe('Tasks', () => {
    it('runsTasks', (done) => {
        const res = 123;
        const t = task<number>((reject, resolve) => {
            resolve(res);
        });
        const fork = taskFork(noop, (result) => {
            chai.expect(result).to.equal(res);
            done();
        });
        t(fork);
    });
    it('runsAllTasks', (done) => {
        let c = 0;
        const t = task((reject, resolve) => {
            resolve(c);
            c += 1;
        });
        taskAll([t, t, t])(
            taskFork(noop, (result) => {
                chai.expect(result).to.be.deep.eq([0, 1, 2]);
                done();
            }),
        );
        chai.expect(c).to.be.eq(3);
    });
    it('passReject', (done) => {
        const err = new Error();
        task((reject) => {
            reject(err);
        })(
            taskFork((error) => {
                chai.expect(err).to.equal(error);
                done();
            }, noop),
        );
    });
    it('mapTasks', (done) => {
        const m = task<number>((reject, resolve) => {
            resolve(2);
        });
        const map = taskMap((result?: number) => {
            return result! + 2;
        });
        const mc = m(map);
        const fork = taskFork(noop, (result) => {
            chai.expect(result).to.be.eq(4);
            done();
        });
        mc(fork);
    });
    it('taskOf resolve sync', () => {
        const testVal = Math.random();
        taskOf(testVal)(
            taskFork(noop, (result) => {
                chai.expect(result).to.be.eq(testVal);
            }) as any,
        );
    });
    it('chainTasks', (done) => {
        const t = task<number>((reject, resolve) => {
            resolve(1);
        });
        const chain = taskChain((result?: number) =>
            task<number>((reject, resolve) => {
                resolve(result! + 1);
            }),
        );
        const forFork = t(chain);
        forFork(
            taskFork(noop, (result?: number) => {
                chai.expect(result).to.be.eq(2);
                done();
            }),
        );
    });
});
