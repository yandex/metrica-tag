/* eslint-env mocha */
import * as chai from 'chai';
import { getVersion } from 'src/version';

describe('Version', () => {
    it('should return some versions', () => {
        const v: Record<string, ReturnType<typeof getVersion>> = {
            uaTag: getVersion(),
            ua: getVersion(),
            preprodTag: getVersion(),
            betaTag: getVersion(),
            tag: getVersion(),
            beta: getVersion(),
            preprod: getVersion(),
            prod: getVersion(),
        };
        const keys = Object.keys(v);
        const versionList = keys.reduce((versions: string[], key: string) => {
            const val = v[key];
            versions.push(val);
            return versions;
        }, []);
        chai.expect(keys.length).to.be.equal(versionList.length);
    });
});
