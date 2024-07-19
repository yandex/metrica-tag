import * as chai from 'chai';
import { fnv32a } from '../fnv32a';

describe('fnv32a', () => {
    it('should generate correct checksum for resources timings', () => {
        Object.entries({
            'www.googletagservices.com/tag/js/gpt.js': 1882689622,
            'www.googleadservices.com/pagead/conversion.js': 2318205080,
            'www.googletagmanager.com/gtm.js': 3115871109,
            'yastatic.net/metrika-static-watch/watch.js': 3604875100,
            'cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js': 339366994,
            'cdn.jsdelivr.net/npm/yandex-metrica-watch/watch.js': 849340123,
            'mc.yandex.ru/metrika/tag_ww.js': 3735661796,
            'mc.yandex.ru/metrika/watch_ww.js': 3082499531,
            'mc.yandex.ru/metrika/watch.js': 2343947156,
            'mc.yandex.ru/metrika/tag.js': 655012937,
            'mc.yandex.ru/metrika/tag_turbo.js': 3724710748,
            'mc.yandex.ru/metrika/tag_jet_beta.js': 3364370932,
            'stats.g.doubleclick.net/dc.js': 1996539654,
            'www.google-analytics.com/ga.js': 2065498185,
            'ssl.google-analytics.com/ga.js': 823651274,
            'www.google-analytics.com/analytics.js': 12282461,
            'ssl.google-analytics.com/analytics.js': 1555719328,
            'counter.yadro.ru/hit': 1417229093,
            'an.yandex.ru/system/context.js': 138396985,
        }).forEach(([url, checksum]) => {
            chai.expect(fnv32a(url)).to.eq(checksum);
        });
    });
});
