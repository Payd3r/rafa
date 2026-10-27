import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import express from 'express';
import { FileGenerator } from '../services/fileGenerator.js';
import { ImageProcessor } from '../services/imageProcessor.js';
import { PROJECT_CATEGORIES } from '../services/projectCategories.js';

test('categories persist through create, edit and public publication; invalid values are rejected', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rafa-categories-'));
  process.env.PUBLIC_PATH = root;
  await fs.mkdir(path.join(root, 'data'));
  process.env.DATA_PATH = path.join(root, 'data', 'projects.json');
  process.env.SRC_PATH = root;
  await fs.writeFile(process.env.DATA_PATH, JSON.stringify([{ slug: 'existing', title: 'Existing', category: 'moda', hasCover: true, imageCount: 0, dateISO: '2026-10-18', description: 'Test' }]));
  const originals = {
    image: ImageProcessor.prototype.processImage,
    meta: FileGenerator.prototype.regenerateImageMetaFile,
    masonry: FileGenerator.prototype.regenerateMasonryLayoutsFile,
  };
  ImageProcessor.prototype.processImage = async () => {};
  FileGenerator.prototype.regenerateImageMetaFile = async () => {};
  FileGenerator.prototype.regenerateMasonryLayoutsFile = async () => {};
  const { default: router } = await import('../routes/admin.js');
  const app = express();
  app.use(express.json());
  app.use('/api/admin', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/admin/projects`;
  const patch = body => fetch(`${base}/existing`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    for (const category of PROJECT_CATEGORIES) {
      const response = await patch({ category });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).project.category, category);
      assert.equal(JSON.parse(await fs.readFile(process.env.DATA_PATH, 'utf8'))[0].category, category);
      assert.equal(JSON.parse(await fs.readFile(path.join(root, 'projects.json'), 'utf8'))[0].category, category);
    }
    for (const category of ['unknown', '', null, ['moda']]) {
      assert.equal((await patch({ category })).status, 400);
    }
    assert.equal(JSON.parse(await fs.readFile(process.env.DATA_PATH, 'utf8'))[0].description, undefined);
    assert.equal((await patch({ type: 'video' })).status, 400);
    assert.equal((await patch({ title: '   ' })).status, 400);
    assert.equal((await patch({ type: 'mixed' })).status, 400);
    const edit = new FormData();
    edit.set('title', 'Updated title'); edit.set('category', 'sport'); edit.set('type', 'photo');
    assert.equal((await fetch(`${base}/existing`, {method: 'PATCH', body: edit})).status, 200);
    assert.equal(JSON.parse(await fs.readFile(process.env.DATA_PATH, 'utf8'))[0].title, 'Updated title');
    for (const category of [undefined, 'unknown', 'video']) {
      const form = new FormData();
      form.set('title', 'New project');
      form.set('description', 'Servizio fotografico a Como');
      form.set('type', 'photo');
      form.set('dateISO', '2026-10-18');
      form.set('cover', new Blob(['test'], { type: 'image/jpeg' }), 'cover.jpg');
      if (category !== undefined) form.set('category', category);
      const response = await fetch(base, { method: 'POST', body: form });
      assert.equal(response.status, category === 'video' ? 200 : 400);
      if (category === 'video') {
        const { project } = await response.json();
        assert.equal(project.category, 'video');
        for (let attempt = 0; attempt < 100; attempt++) {
          const list = await (await fetch(base)).json();
          if (list.projects.some(item => item.slug === project.slug)) break;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        const list = await (await fetch(base)).json();
        assert.equal(list.projects.find(item => item.slug === project.slug).category, 'video');
        const published = JSON.parse(await fs.readFile(path.join(root, 'projects.json'), 'utf8'));
        assert.equal(published.find(item => item.slug === project.slug).category, 'video');
        assert.equal(published.find(item => item.slug === project.slug).description, undefined);
      }
    }
    const folder = path.join(root, 'optimized', 'existing');
    for (const id of [1, 2, 3]) {
      await fs.mkdir(path.join(folder, String(id)), {recursive:true});
      await fs.writeFile(path.join(folder, String(id), 'original.avif'), 'original');
    }
    const records = JSON.parse(await fs.readFile(process.env.DATA_PATH, 'utf8'));
    Object.assign(records.find(p => p.slug === 'existing'), {imageCount:3,galleryIndices:[1,2,3]});
    await fs.writeFile(process.env.DATA_PATH, JSON.stringify(records));
    const media = new FormData();
    media.set('retainedImages', '[1,3]'); media.set('coverImageIndex', '3');
    media.set('images', new Blob(['new'], {type:'image/jpeg'}), 'new.jpg');
    const edited = await fetch(`${base}/existing`, {method:'PATCH',body:media});
    assert.equal(edited.status, 200);
    const editedProject = (await edited.json()).project;
    assert.deepEqual(editedProject.galleryIndices, [1,3,4]);
    assert.equal(editedProject.imageCount, 3);
    assert.equal(editedProject.coverImageIndex, '3');
    await assert.rejects(fs.access(path.join(folder,'2')));
    const publicProject = JSON.parse(await fs.readFile(path.join(root,'projects.json'),'utf8')).find(p => p.slug === 'existing');
    assert.deepEqual(publicProject.gallery.map(p => p.src), [1,3,4].map(id => `/optimized/existing/${id}/thumb.avif`));
    assert.equal(publicProject.cover.src, '/optimized/existing/3/thumb.avif');
    for (const bad of ['../cover', '99']) assert.equal((await patch({coverImageIndex:bad})).status, 400);
    for (const bad of ['[1,1]', '[99]', 'null', 'oops']) assert.equal((await patch({retainedImages:bad})).status, 400);
    const coverRemoval = await patch({retainedImages:'[1,4]',coverImageIndex:'3'});
    assert.equal(coverRemoval.status,200);
    assert.equal((await coverRemoval.json()).project.coverImageIndex,'cover');
    await assert.rejects(fs.access(path.join(folder,'3')));
    for (const [type, images, video] of [['photo', false, true], ['video', true, true], ['video', false, false]]) {
      const form = new FormData();
      for (const [key, value] of Object.entries({title:'Invalid media', type, category:'moda', dateISO:'2026-10-18'})) form.set(key,value);
      form.set('cover',new Blob(['test'],{type:'image/jpeg'}),'cover.jpg');
      if (images) form.set('images',new Blob(['test'],{type:'image/jpeg'}),'image.jpg');
      if (video) form.set('video',new Blob(['test'],{type:'video/mp4'}),'video.mp4');
      assert.equal((await fetch(base,{method:'POST',body:form})).status,400);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    ImageProcessor.prototype.processImage = originals.image;
    FileGenerator.prototype.regenerateImageMetaFile = originals.meta;
    FileGenerator.prototype.regenerateMasonryLayoutsFile = originals.masonry;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('carousel ordering persists when image metadata is regenerated', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rafa-carousel-'));
  try {
    const folder = path.join(root, 'optimized', 'example', 'cover');
    await fs.mkdir(folder, {recursive:true});
    await fs.writeFile(path.join(folder,'meta.json'),JSON.stringify({width:800,height:600,isBest:true,bestOrder:2}));
    const generator = new FileGenerator(root,root);
    await generator.regenerateImageMetaFile();
    const meta = JSON.parse(await fs.readFile(path.join(root,'imageMeta.json'),'utf8'));
    assert.equal(meta['/optimized/example/cover/thumb.avif'].bestOrder,2);
    assert.equal(meta['/optimized/example/cover/thumb.avif'].isBest,true);
  } finally {await fs.rm(root,{recursive:true,force:true})}
});
