import * as chai from 'chai';
import * as sinon from 'sinon';
import * as dom from 'src/utils/dom/dom';
import { stringify } from 'src/utils/querystring';
import * as parse from '../url';
import { addQuery } from '../url';

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

    describe('addQuery', () => {
        it('should return url if query is not provided', () => {
            const url = 'https://example.com:9090/some-path#some-hash';
            const result = addQuery(url, undefined);
            chai.expect(result).to.equal(url);
        });
        it('should return valid url if query is provided', () => {
            const url =
                'https://example.com:9090/some-path#some-hash-1#some-hash-2';
            const expectedUrl =
                'https://example.com:9090/some-path?a=first_parameter&b=%3F#some-hash-1#some-hash-2';
            const query = stringify({ a: 'first_parameter', b: '?' });
            const result = addQuery(url, query);
            chai.expect(result).to.equal(expectedUrl);
        });
        it('should return valid url if query was already provided in the url', () => {
            const url =
                'https://example.com::9090/some-path?a=1&b=2#some-hash-1#some-hash-2';
            const expectedUrl =
                'https://example.com::9090/some-path?a=1&b=2&c=3#some-hash-1#some-hash-2';
            const query = stringify({ c: '3' });
            const result = addQuery(url, query);
            chai.expect(result).to.equal(expectedUrl);
        });
    });
});
