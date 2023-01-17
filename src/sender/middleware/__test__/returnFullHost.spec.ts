import * as sinon from 'sinon';
import { expect } from 'chai';
import * as config from 'src/config';
import { returnFullHost } from '../returnFullHost';

describe('sender utils / middleware / returnFullHost', () => {
    const cProtocol = 'protocol';
    const defaultHost = 'defaultHost';
    const testHost = 'testHost';
    const resource = 'resource';

    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox.stub(config, 'config').value({ cProtocol });
        sandbox.stub(config, 'host').value(defaultHost);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns a combination of default protocol and host values appended with provided resource', () => {
        const result = returnFullHost(resource);
        expect(result).to.eq(`${cProtocol}//${defaultHost}/${resource}`);
    });

    it('returns a combination of default protocol value appended with provided host and resource', () => {
        const result = returnFullHost(resource, testHost);
        expect(result).to.eq(`${cProtocol}//${testHost}/${resource}`);
    });
});
