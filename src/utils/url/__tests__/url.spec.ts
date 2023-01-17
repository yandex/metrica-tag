import * as chai from 'chai';
import * as sinon from 'sinon';
import * as dom from 'src/utils/dom';
import * as parse from '../url';

describe('Url utils', () => {
    const sandbox = sinon.createSandbox();
    let getElemCreateFunctionStub: any;

    beforeEach(() => {
        getElemCreateFunctionStub = sandbox.stub(dom, 'getElemCreateFunction');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('parseUrl', () => {
        const parser = {
            protocol: 'https:',
            host: 'example.com:9090',
            port: '9090',
            hostname: 'example.com',
            hash: '#some-hash',
            search: '?a=1&b=2',
            query: 'a=1&b=2',
            pathname: '/some-path',
            path: '/some-path?a=1&b=2',
            href: 'https://example.com:9090/some-path?a=1&b=2#some-hash',
        };

        getElemCreateFunctionStub.returns(() => parser);

        const result = parse.parseUrl(
            {} as any,
            'https://example.com:9090/some-path?a=1&b=2#some-hash',
        );
        chai.expect(result).to.deep.equal(parser);
    });
});
