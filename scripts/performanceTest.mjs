import { JSDOM } from 'jsdom';
import nock from 'nock';

const url = "http://localhost";

const corsHeaders = {
  "Access-Control-Allow-Methods": 
    "PUT, OPTIONS, CONNECT, PATCH, GET, HEAD, POST, DELETE, TRACE",
  "Access-Control-Allow-Origin": url,
  "Access-Control-Expose-Headers": "link, etag, location",
  "access-control-allow-credentials": "true",
  "Access-Control-Allow-Headers": "user-agent",
};

const run = async () => {
  nock('https://mc.yandex.ru/')
    .replyContentLength()
    .persist()
    .get(/watch.*/)
    .reply(200, () => {
      return {
      "settings":{
        "auto_goals":1,
        "button_goals":0,
        "c_recp":"1.00000",
        "form_goals":1,
        "pcs":"0",
        "sbp": {
          "a":"fSf06HfTTbfh2sQApUDes4cFRpmvsj+qVCk4yFuCGYMQzZfVRxPb3JXOG8h800G0", 
          "b":"Rpx5Hq1l9mo2ilUPi0QC0sFP4lx51N9gl/5aPBfG5zY="
        },
        "eu":1,
        "hittoken":"1681287326_ba032b8425091cf03d75ab94c373f8aed48b91e2faed84218d7e032f9c7a504c",
        "cf":1
      },"userData":{}
    }}, corsHeaders)
  const { window: win} = new JSDOM('', {
    url
  })
  const { main } = await import('../_build/public/watch.mjs');
  Object.defineProperty(win.document, "visibilityState", {
    configurable: true,
    get: function() { return "visible"; }
  });

  win.ym = {
    a: [[1, 'init']]
  };
  for (let i = 0; i < 100; i++) {
    win.ym.a.push([i + 10, 'init']);
  }
  main(win);
}
run()
