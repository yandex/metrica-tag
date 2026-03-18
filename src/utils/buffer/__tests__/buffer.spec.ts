import * as chai from 'chai';
import { createBuffer } from '../buffer';

describe('Buffer', () => {
    it('creates an empty buffer', () => {
        const buffer = createBuffer(5);
        chai.expect(buffer.bufferArray).to.have.lengthOf(0);
    });

    it('allows pushing items', () => {
        const buffer = createBuffer<number>(5);
        buffer.push(1, 2, 3);
        chai.expect(buffer.bufferArray).to.have.lengthOf(3);
        chai.expect([...buffer.bufferArray]).to.deep.equal([1, 2, 3]);
    });

    it('truncates to maxSize when exceeding limit', () => {
        const buffer = createBuffer<number>(3);
        buffer.push(1, 2, 3, 4, 5);
        chai.expect(buffer.bufferArray).to.have.lengthOf(3);
        chai.expect([...buffer.bufferArray]).to.deep.equal([3, 4, 5]);
    });

    it('truncates on subsequent pushes', () => {
        const buffer = createBuffer<number>(2);
        buffer.push(1);
        buffer.push(2);
        buffer.push(3);
        chai.expect(buffer.bufferArray).to.have.lengthOf(2);
        chai.expect([...buffer.bufferArray]).to.deep.equal([2, 3]);
    });

    it('flush returns all items and empties buffer', () => {
        const buffer = createBuffer<number>(5);
        buffer.push(1, 2, 3);
        const flushed = buffer.flush();
        chai.expect(flushed).to.deep.equal([1, 2, 3]);
        chai.expect(buffer.bufferArray).to.have.lengthOf(0);
    });

    it('flush on empty buffer returns empty array', () => {
        const buffer = createBuffer<number>(5);
        const flushed = buffer.flush();
        chai.expect(flushed).to.deep.equal([]);
    });

    it('slice returns all items', () => {
        const buffer = createBuffer<number>(5);
        buffer.push(1, 2, 3);
        const sliced = buffer.slice();
        chai.expect(sliced).to.deep.equal([1, 2, 3]);
        chai.expect(buffer.bufferArray).to.have.lengthOf(3);
    });

    it('can add after flush', () => {
        const buffer = createBuffer<number>(3);
        buffer.push(1, 2);
        buffer.flush();
        buffer.push(3, 4);
        chai.expect([...buffer.bufferArray]).to.deep.equal([3, 4]);
    });

    it('add returns new length', () => {
        const buffer = createBuffer<number>(5);
        const len = buffer.push(1, 2);
        chai.expect(len).to.equal(2);
    });

    it('works with maxSize of 1', () => {
        const buffer = createBuffer<string>(1);
        buffer.push('a');
        buffer.push('b');
        chai.expect(buffer.bufferArray).to.have.lengthOf(1);
        chai.expect([...buffer.bufferArray]).to.deep.equal(['b']);
    });
});
