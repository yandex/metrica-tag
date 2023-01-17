import * as chai from 'chai';
import { boxStyles, getStyles } from '../layout/siteStatisticsLayout';

describe('siteStatistics layout', () => {
    describe('boxStyles', () => {
        it("should return {width: '2px', height: '2px'}", () => {
            const result = boxStyles('2px');
            chai.expect(result).to.eql({ width: '2px', height: '2px' });
        });
        it("should return {width: '2px', height: '4px'}", () => {
            const result = boxStyles('2px', '4px');
            chai.expect(result).to.eql({ width: '2px', height: '4px' });
        });
    });
    describe('getStyles', () => {
        it('should return object with passed keys and value', () => {
            const result = getStyles(['width', 'height'], 'initial');
            chai.expect(result).to.eql({ width: 'initial', height: 'initial' });
        });
        it('should return empty object', () => {
            const result = getStyles([], 'initial');
            chai.expect(result).to.eql({});
        });
    });
});
