// Read-only checks for the real published domain. No credentials or submissions.
import assert from 'node:assert/strict';
const origin = new URL(process.argv[2] || 'https://invalid.example').origin;
if (!process.argv[2] || !origin.startsWith('https://')) throw new Error('Uso: node scripts/audit-seo.mjs https://dominio.it');
async function get(uri) {
 const response = await fetch(origin+uri,{signal:AbortSignal.timeout(15000)});
 return {response,text:await response.text()};
}
const results = await Promise.allSettled([
 (async () => {const {response,text} = await get('/'); assert.equal(response.status,200); assert.match(text,/<h1[ >]/); assert.match(text,new RegExp(`rel="canonical" href="${origin.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/"`)); assert.ok(!/noindex/.test(response.headers.get('x-robots-tag') || '')); assert.ok(!/<meta name="robots" content="noindex/.test(text)); return 'Home: HTML e canonical';})(),
 (async () => {const {response,text} = await get('/sitemap.xml'); assert.equal(response.status,200); assert.match(text,/<url>/); assert.ok(text.includes(origin+'/')); assert.ok(!text.includes('<loc>'+origin+'/admin')); return 'Sitemap: presente e popolata';})(),
 (async () => {const {text} = await get('/robots.txt'); assert.ok(text.includes('Sitemap: '+origin+'/sitemap.xml')); return 'Robots: sitemap dichiarata';})(),
 (async () => {const {response} = await get('/__seo_check_missing_page__'); assert.equal(response.status,404); return 'URL inesistente: HTTP 404';})(),
 (async () => {const {response,text} = await get('/admin'); assert.equal(response.status,200); assert.match(response.headers.get('x-robots-tag') || text,/noindex/); return 'Admin: noindex';})(),
]);
for (const result of results) {if(result.status === 'fulfilled') console.log('OK',result.value); else {console.error('ERRORE',result.reason.message);process.exitCode=1;}}
