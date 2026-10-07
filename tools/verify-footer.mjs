import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseURL = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const output = path.join(root, 'artifacts', 'footer');
await mkdir(output, { recursive: true });
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === 'win32') {
  const cache = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  for (const version of (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, version, 'chrome-win64', 'chrome.exe');
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
const report = [];
const state = page => page.evaluate(() => window.__maccFooterField.getState());
const reveal = async page => {
  await page.locator('[data-footer-observer]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => ['webgl', 'fallback'].includes(window.__maccFooterField?.getState().renderer));
  await page.waitForTimeout(180);
};
// With preserveDrawingBuffer=false, redraw and read in the same task.
const sample = (page, time) => page.evaluate(time => {
  const api = window.__maccFooterField, current = api.getState();
  if (current.ready && !current.lost) api.renderAt(time ?? current.time);
  const canvas = document.querySelector(current.renderer === 'webgl' && !current.lost ? '[data-footer-canvas]' : '[data-footer-preview]');
  const copy = document.createElement('canvas');
  copy.width = canvas.width; copy.height = canvas.height;
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0);
  const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
  let lit = 0, hash = 0, farLight = 0, nearLight = 0, opaqueSky = 0, skyPixels = 0;
  for (let y = 0; y < copy.height; y++) for (let x = 0; x < copy.width; x++) {
    const i = (y * copy.width + x) * 4;
    const alpha = pixels[i + 3] / 255;
    const brightness = Math.max(pixels[i] * alpha, pixels[i + 1] * alpha, pixels[i + 2] * alpha);
    if (y < copy.height * .2) { skyPixels++; if (pixels[i + 3] > 250) opaqueSky++; }
    if (brightness > 50) lit++;
    if (brightness > 100 && y > copy.height * .3 && y < copy.height * .6) farLight++;
    if (brightness > 50 && y > copy.height * .6) nearLight++;
    hash = (Math.imul(hash, 31) + pixels[i] + 3 * pixels[i + 1] + 7 * pixels[i + 2] + 11 * pixels[i + 3]) | 0;
  }
  const rect = document.querySelector('[data-footer-observer]').getBoundingClientRect();
  const footer = document.querySelector('.site-footer');
  return {...api.getState(), lit, hash, farLight, nearLight, opaqueSkyRatio:opaqueSky / skyPixels, fieldWidth:rect.width, fieldHeight:rect.height,
    footerWidth:footer.getBoundingClientRect().width, footerBackground:getComputedStyle(footer).backgroundColor,
    left:rect.left, viewport:document.documentElement.clientWidth, overflow:document.documentElement.scrollWidth > innerWidth};
}, time);
const pageErrors = page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /shader|WebGLProgram/i.test(message.text())) errors.push(message.text()); });
  return errors;
};
try {
  for (const viewport of [
    {width:1440,height:1000}, {width:1318,height:680}, {width:1920,height:1080},
    {width:820,height:900}, {width:390,height:844}, {width:430,height:932,dpr:3}, {width:1280,height:800,dpr:2}
  ]) {
    const page = await browser.newPage({viewport:{width:viewport.width,height:viewport.height}, deviceScaleFactor:viewport.dpr ?? 1,
      isMobile:viewport.width <= 600, hasTouch:viewport.width <= 600, reducedMotion:'reduce'});
    const errors = pageErrors(page), requests = [];
    page.on('request', request => { if (request.url().includes('/vendor/three/')) requests.push(request.url()); });
    await page.goto(baseURL, {waitUntil:'networkidle'});
    const initial = await state(page);
    assert.equal(initial.renderer, 'pending', 'Footer initialized while far below the hero');
    assert.equal(initial.animating, false);
    await reveal(page);
    const before = await sample(page, 15);
    assert.equal(before.renderer, 'webgl');
    assert.equal(before.animating, false, 'Reduced motion was ignored');
    assert(Math.abs(before.fieldWidth - before.viewport) < 1 && Math.abs(before.left) < 1, 'Sea is not full bleed');
    assert.equal(before.overflow, false);
    assert(Math.abs(before.footerWidth - before.viewport) < 1, 'Dark footer does not span the page');
    assert.equal(before.footerBackground, 'rgb(6, 9, 19)', 'Introduction and contacts must share the sea background');
    assert.equal(before.opaqueSkyRatio, 1, 'The approved dark background must remain opaque');
    assert.equal(await page.locator('[data-footer-pause]').count(), 0, 'Removed play button returned');
    assert(before.words > 1500 && before.lit > 1000 && before.farLight > 50 && before.nearLight > 100, 'Missing text or distant reflections');
    assert(before.buffer[0] * before.buffer[1] <= 4510000, 'Automatic rendering exceeded its pixel budget');
    assert.equal(before.dpr, Math.min(viewport.dpr ?? 1, 2), 'HiDPI text started below its clarity target');
    assert.equal(before.buffer[0], Math.round(before.fieldWidth * before.dpr));
    const after = await sample(page, 28);
    assert.notEqual(before.hash, after.hash, 'Waves or reflection did not move');
    for (const time of [600, 14400]) {
      const longRun = await sample(page, time);
      assert(longRun.lit > 1000 && longRun.farLight > 50, 'Word sea lost its lighting after long playback');
    }
    await sample(page, 15);
    await page.locator('[data-footer-observer]').screenshot({path:path.join(output, `field-${viewport.width}.png`)});
    await page.evaluate(() => scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
    await page.screenshot({path:path.join(output, `footer-${viewport.width}.png`)});
    assert.equal(await page.locator('[data-contact-list] a[href^="mailto:"]').count(), 1);
    assert.deepEqual(requests, [], 'Old Three.js footer runtime still downloads');
    assert.deepEqual(errors, []);
    report.push({viewport, before, after});
    await page.close();
    console.log(`PASS ${viewport.width}: full-width word sea, far/near shimmer, 4-hour bounds, mobile/DPR, contact content`);
  }

  const live = await browser.newPage({viewport:{width:1440,height:1000}});
  const liveErrors = pageErrors(live);
  await live.goto(baseURL, {waitUntil:'networkidle'});
  await live.evaluate(() => {
    const y = document.querySelector('[data-footer-observer]').getBoundingClientRect().top + scrollY;
    scrollTo({top:y-innerHeight-800,behavior:'instant'});
  });
  await live.waitForFunction(() => window.__maccFooterField.getState().ready);
  assert.equal((await state(live)).visible, false, 'Preparation happened after entering view');
  assert.equal((await state(live)).animating, false);
  await reveal(live);
  const moving = await state(live);
  await live.waitForTimeout(350);
  assert((await state(live)).time > moving.time);
  const box = await live.locator('[data-footer-observer]').boundingBox();
  await live.mouse.move(box.x+box.width*.85,box.y+box.height*.55);
  await live.waitForTimeout(250);
  assert((await state(live)).cameraX > .02, 'Pointer parallax missing');
  await live.mouse.move(0,0);
  await live.emulateMedia({reducedMotion:'reduce'});
  await live.waitForTimeout(100);
  const reduced = await state(live);
  const stillFrame = await sample(live);
  await live.waitForTimeout(150);
  assert.equal((await state(live)).time, reduced.time);
  assert.equal(reduced.animating, false);
  assert.equal((await sample(live)).hash, stillFrame.hash);
  await live.emulateMedia({reducedMotion:'no-preference'});
  await live.waitForTimeout(100);
  assert((await state(live)).animating);
  await live.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await live.waitForFunction(() => !window.__maccFooterField.getState().visible);
  const offscreen = await state(live);
  await live.waitForTimeout(200);
  assert.equal((await state(live)).time, offscreen.time);
  await reveal(live);
  assert((await state(live)).animating);
  await live.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable:true, value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await state(live);
  await live.waitForTimeout(150);
  assert.equal((await state(live)).time, hidden.time);
  assert.equal(hidden.animating, false);
  await live.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  assert((await state(live)).animating);
  await live.evaluate(() => {
    window.__lostSea = document.querySelector('[data-footer-canvas]').getContext('webgl2').getExtension('WEBGL_lose_context');
    window.__lostSea.loseContext();
  });
  await live.waitForFunction(() => window.__maccFooterField.getState().lost);
  assert(await live.locator('[data-footer-preview]').isVisible());
  assert((await sample(live)).lit > 1000);
  await live.evaluate(() => window.__lostSea.restoreContext());
  await live.waitForFunction(() => !window.__maccFooterField.getState().lost && window.__maccFooterField.getState().animating);
  assert((await sample(live)).lit > 1000);
  for (const width of [1920,390,760,1440,820,1318]) {
    await live.setViewportSize({width,height:900}); await reveal(live);
    const resized = await sample(live);
    assert.equal(resized.overflow,false);
    assert(Math.abs(resized.fieldWidth-width)<1 && resized.lit>1000 && resized.animating);
  }
  assert.deepEqual(liveErrors,[]);
  await live.close();
  console.log('PASS lifecycle: near-viewport preparation, motion/parallax, reduced motion, offscreen/hidden, context restore, resize');

  const fallback = await browser.newPage({viewport:{width:1440,height:1000}});
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type,...args) {return type.startsWith('webgl') ? null : getContext.call(this,type,...args);};
  });
  const fallbackErrors = pageErrors(fallback);
  await fallback.goto(baseURL,{waitUntil:'networkidle'}); await reveal(fallback);
  for (const width of [1440,390]) {
    await fallback.setViewportSize({width,height:900}); await reveal(fallback);
    const still = await sample(fallback);
    assert.equal(still.renderer,'fallback'); assert.equal(still.animating,false);
    assert(still.lit>1000 && !still.overflow);
    assert.equal(await fallback.locator('[data-footer-pause]').isVisible(),false);
    await fallback.locator('[data-footer-observer]').screenshot({path:path.join(output,`fallback-${width}.png`)});
  }
  assert.deepEqual(fallbackErrors,[]); await fallback.close();
  console.log('PASS responsive no-WebGL fallback');

  const adaptive = await browser.newPage({viewport:{width:703,height:900},deviceScaleFactor:2});
  await adaptive.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window), clocks = new WeakMap();
    window.__testFrameStep = 32;
    window.requestAnimationFrame = callback => raf(() => {
      const time = (clocks.get(callback) ?? 0) + window.__testFrameStep;
      clocks.set(callback,time); callback(time);
    });
  });
  await adaptive.goto(baseURL,{waitUntil:'networkidle'}); await reveal(adaptive);
  const detailed = await state(adaptive);
  await adaptive.waitForFunction(() => window.__maccFooterField.getState().level === 0);
  const thinned = await state(adaptive);
  assert.equal(thinned.dpr,2,'Detail adaptation reduced text resolution too early');
  assert.equal(thinned.nearWords,detailed.nearWords,'Adaptation removed readable foreground words');
  assert(thinned.words < detailed.words && thinned.streaks < detailed.streaks,'Distant detail was not reduced');
  await adaptive.evaluate(() => {window.__testFrameStep=48;});
  await adaptive.waitForFunction(() => window.__maccFooterField.getState().resolutionLimited);
  const limited = await sample(adaptive);
  assert.equal(limited.dpr,1.5,'Emergency adaptation did not preserve its 1.5x clarity floor');
  assert.equal(limited.nearWords,detailed.nearWords);
  assert(limited.lit>1000 && limited.animating);
  await adaptive.close();
  console.log('PASS adaptation: distant detail first, stable foreground, 2x normal / 1.5x overload');

  for (const variant of ['A-V1','A-V2','A-V3','B-V3','C-V1','C-V2','C-V3']) {
    const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const errors = pageErrors(page);
    await page.goto(`${baseURL}/${variant}.html`,{waitUntil:'networkidle'}); await reveal(page);
    assert.equal((await sample(page,15)).hash,report[0].before.hash,`${variant}: word sea differs from homepage`);
    assert.deepEqual(errors,[]); await page.close();
  }
  console.log('PASS all seven variants render the same word sea');

  const build = JSON.parse(execFileSync(process.execPath,['tools/build-site.mjs','--json'],{cwd:root,encoding:'utf8'}));
  const relative = path.relative(root,build.directory).split(path.sep).join('/');
  const deployed = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const missing = [], deployedErrors = pageErrors(deployed);
  deployed.on('response',response=>{if(response.status()===404)missing.push(response.url());});
  await deployed.goto(`${baseURL}/${relative}/`,{waitUntil:'networkidle'}); await reveal(deployed);
  assert.equal((await sample(deployed,15)).hash,report[0].before.hash,'Deployable site differs from local rendering');
  assert.deepEqual(missing,[]); assert.deepEqual(deployedErrors,[]);
  await deployed.close();
  console.log('PASS deployment subdirectory: identical rendering and no missing resources');
  await writeFile(path.join(output,'report.json'),JSON.stringify({checks:report,build},null,2));
} finally {
  await browser.close();
}
