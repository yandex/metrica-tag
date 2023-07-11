import * as chai from 'chai';
import * as sinon from 'sinon';
import * as dom from 'src/utils/dom';
import * as parse from '../url';

describe('Url utils', () => {
    const sandbox = sinon.createSandbox();
    let getElemCreateFunctionStub: sinon.SinonStub<
        Parameters<typeof dom.getElemCreateFunction>,
        ReturnType<typeof dom.getElemCreateFunction>
    >;

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
            pathname: '/some-path',
            href: 'https://example.com:9090/some-path?a=1&b=2#some-hash',
        } as HTMLAnchorElement;

        getElemCreateFunctionStub.returns(() => parser);

        const result = parse.parseUrl(
            {} as Window,
            'https://example.com:9090/some-path?a=1&b=2#some-hash',
        );
        chai.expect(result).to.deep.equal({
            ...parser,
            query: 'a=1&b=2',
            path: '/some-path?a=1&b=2',
        });
    });
});
