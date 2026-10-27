import assert from 'node:assert/strict';
import { chromium } from '../frontend/node_modules/playwright/index.mjs';
const base = process.env.BENCH_URL || 'http://172.19.0.11';
const projects = await fetch(base + '/projects.json').then(r => r.json());
const project = projects.find(p => p.video);
assert.ok(project, 'A published video project is required');
const browser = await chromium.launch();
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({viewport: {width, height:900}, ...(width < 760 ? {isMobile:true, hasTouch:true} : {})});
    const page = await context.newPage();
    await page.goto(base + '/projects/' + project.slug);
    await page.waitForFunction(() => document.querySelector('.film-player video')?.duration > 0);
    const geometry = await page.evaluate(() => {
      const heading = document.querySelector('.project-heading');
      const h = heading.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(heading).paddingLeft);
      const player = document.querySelector('.film-player');
      const r = player.getBoundingClientRect();
      const controls = document.querySelector('.film-controls');
      return {x:r.x, width:r.width, titleX:h.x+padding, titleWidth:h.width-padding*2, overflow:controls.scrollWidth > controls.clientWidth, nativeControls:player.querySelector('video').controls};
    });
    assert.ok(Math.abs(geometry.x-geometry.titleX)<1);
    assert.ok(Math.abs(geometry.width-geometry.titleWidth)<1);
    assert.equal(geometry.overflow,false);
    assert.equal(geometry.nativeControls,false);
    await page.getByRole('button',{name:'Riproduci il video',exact:true}).click();
    await page.waitForFunction(() => {const v=document.querySelector('.film-player video'); return !v.paused && v.currentTime>.1});
    if(width===1440){
      await page.mouse.move(0,0);
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('.film-controls')).opacity==='0');
      await page.locator('.film-player').hover();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('.film-controls')).opacity==='1');
    }
    await page.getByRole('button',{name:'Pausa',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.film-player video').paused);
    await page.getByRole('button',{name:'Disattiva audio',exact:true}).click();
    assert.equal(await page.locator('.film-player video').evaluate(v=>v.muted),true);
    await page.getByRole('button',{name:'Attiva audio',exact:true}).click();
    assert.equal(await page.locator('.film-player video').evaluate(v=>v.muted),false);
    await page.getByRole('slider',{name:'Avanzamento video'}).fill('5');
    await page.waitForFunction(()=>Math.abs(document.querySelector('.film-player video').currentTime-5)<.2);
    if(width===1440){
      await page.getByRole('button',{name:'Schermo intero',exact:true}).click();
      await page.waitForFunction(()=>!!document.fullscreenElement);
      await page.getByRole('button',{name:'Esci da schermo intero',exact:true}).click();
      await page.waitForFunction(()=>!document.fullscreenElement);
      await page.locator('.film-player').scrollIntoViewIfNeeded();
      await page.screenshot({path:'output/project-video-desktop.png'});
    }
    console.log(width, 'title alignment, controls, playback, seek and audio passed');
    await context.close();
  }
  const page=await browser.newPage();
  await page.route('**/video/optimized.mp4',route=>route.abort());
  await page.goto(base+'/projects/'+project.slug);
  await page.getByRole('button',{name:'Riprova',exact:true}).waitFor();
  assert.ok(await page.getByRole('alert').isVisible());
  console.log('Video failure: retry control visible');
} finally {await browser.close()}
