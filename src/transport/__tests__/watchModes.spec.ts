import * as chai from 'chai';
import { bodyToQuery } from 'src/utils/querystring';
import { TransportOptions } from '../types';
import { getSrcUrl } from '../watchModes';

describe('getSrcUrl', () => {
    it('returns url if query and body are not provided', () => {
        const url =
            'https://example.com:9090/some-path?a=1&b=2#some-hash-1#some-hash-2';
        const opt: TransportOptions = {};
        const query: Record<string, string> = {};
        const result = getSrcUrl(url, opt, query);
        chai.expect(result).to.equal(url);
    });
    it('returns url if query is provided', () => {
        const url =
            'https://example.com:9090/some-path?a=1&b=2#some-hash-1#some-hash-2';
        const opt: TransportOptions = {};
        const query: Record<string, string> = {
            a: 'first_parameter',
            b: '?',
        };
        const expectedUrl =
            'https://example.com:9090/some-path?a=1&b=2&a=first_parameter&b=%3F#some-hash-1#some-hash-2';
        const result = getSrcUrl(url, opt, query);
        chai.expect(result).to.equal(expectedUrl);
    });
    it('returns url if body and query are provided', () => {
        const url =
            'https://example.com:9090/some-path?a=1&b=2#some-hash-1#some-hash-2';
        const opt: TransportOptions = {
            rBody: bodyToQuery('{a:8}'),
        };
        const query: Record<string, string> = {
            a: 'first_parameter',
            b: '?',
        };
        const expectedUrl =
            'https://example.com:9090/some-path?a=1&b=2&a=first_parameter&b=%3F&_pa=%7Ba%3A8%7D#some-hash-1#some-hash-2';
        const result = getSrcUrl(url, opt, query);
        chai.expect(result).to.equal(expectedUrl);
    });
});
