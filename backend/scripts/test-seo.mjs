import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {siteConfig,pageData,headMarkup,sitemap,installSeo} from '../services/seo.js';
const config = siteConfig({SITE_URL:'https://example.com',SEO_INDEXABLE:'true'});
const projects = [{slug:'fashion',title:'Fashion </script>',cover:{src:'/optimized/cover.webp',alt:'Fashion'},gallery:[]}];
test('canonical, exclusions, escaping and fail-closed configuration', () => {
 assert.equal(pageData('/projects',projects,config).canonical,'https://example.com/');
 assert.match(pageData('/admin',projects,config).robots,/noindex/);
 assert.equal(pageData('/missing',projects,config).status,404);
 assert.match(pageData('/',projects,siteConfig({})).robots,/noindex/);
 assert.throws(() => siteConfig({SITE_URL:'http://example.com'}));
 const head = headMarkup(pageData('/projects/fashion',projects,config));
 assert.ok(!head.includes('Fashion </script>'));
 assert.match(head,/\\u003c/);
 assert.match(sitemap(projects,config),/image:loc/);
 assert.ok(!sitemap(projects,config).includes('<loc>https://example.com/projects</loc>'));
});
test('HTTP returns semantic HTML, current sitemap, noindex admin and real 404', async () => {
 const dir = await mkdtemp(path.join(tmpdir(),'rafa-seo-'));
 await writeFile(path.join(dir,'projects.json'),JSON.stringify(projects));
 await writeFile(path.join(dir,'index.html'),'<html><head><title>Old</title></head><body><div id="app">Loading</div><script type="module" src="/app.js"></script></body></html>');
 const app = express(); installSeo(app,{publicPath:dir,config});
 const server = app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 try {
  const response = await fetch(base+'/projects/fashion'); const html = await response.text();
  assert.equal(response.status,200); assert.match(html,/<h1>Fashion &lt;\/script&gt;<\/h1>/); assert.match(html,/rel="canonical"/); assert.ok(!html.includes('Loading'));
  assert.equal((await fetch(base+'/missing')).status,404);
  assert.match((await fetch(base+'/admin')).headers.get('x-robots-tag'),/noindex/);
  assert.match(await (await fetch(base+'/robots.txt')).text(),/Sitemap: https:\/\/example.com/);
  await writeFile(path.join(dir,'projects.json'),'[]');
  assert.ok(!(await (await fetch(base+'/sitemap.xml')).text()).includes('/projects/fashion'));
 } finally {await new Promise(resolve => server.close(resolve)); await rm(dir,{recursive:true,force:true});}
});
