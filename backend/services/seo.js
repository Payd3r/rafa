import fs from 'node:fs/promises';
import path from 'node:path';

export const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export function siteConfig(env = process.env) {
  const url = env.SITE_URL ? new URL(env.SITE_URL) : null;
  if (url && (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password)) throw new Error('SITE_URL deve essere una origine HTTPS, senza percorso o credenziali');
  return { origin: url?.origin, indexed: Boolean(url && env.SEO_INDEXABLE === 'true') };
}
export function pageData(pathname, projects, config) {
  const project = projects.find(p => `/projects/${encodeURIComponent(p.slug)}` === pathname);
  const known = ['/', '/projects', '/gallery', '/admin'].includes(pathname) || Boolean(project);
  const title = project ? `${project.title} — Andrea Farao` : pathname === '/gallery' ? 'Galleria fotografica — Andrea Farao' : pathname === '/admin' ? 'Admin — Andrea Farao' : pathname === '/projects' ? 'Progetti fotografici e video — Andrea Farao' : 'Andrea Farao — Fotografo e videomaker | Como, Lecco, Monza e Milano';
  const description = project?.description?.trim() ? project.description.trim().replace(/\s+/g, ' ').slice(0, 170) : project ? `${project.title}: progetto ${project.type === 'video' ? 'video' : 'fotografico'} di Andrea Farao. Scopri il lavoro e contatta lo studio per servizi e collaborazioni in Lombardia e Nord Italia.` : 'Andrea Farao, fotografo e videomaker tra Como, Lecco, Monza e Milano. Fotografia moda, beauty, eventi, sport e video in Lombardia e nel Nord Italia.';
  const canonical = config.origin && known && pathname !== '/admin' ? config.origin + (pathname === '/projects' ? '/' : pathname) : null;
  const image = config.origin && project?.cover?.src ? new URL(project.cover.src, config.origin).href : null;
  const robots = config.indexed && known && pathname !== '/admin' ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const schema = canonical ? {'@context':'https://schema.org','@graph':[
    {'@type':'Person','@id':`${config.origin}/#andrea-farao`,name:'Andrea Farao',url:config.origin,jobTitle:'Fotografo e videomaker',knowsAbout:['Fotografia moda','Beauty','Fotografia eventi','Fotografia sportiva','Produzione video'],sameAs:['https://www.instagram.com/inside.faraostudio/']},
    {'@type': project ? 'CreativeWork' : pathname === '/gallery' ? 'CollectionPage' : 'WebSite',name:title,url:canonical,description, ...(project ? {creator:{'@id':`${config.origin}/#andrea-farao`},...(image ? {image} : {})} : {})}
  ]} : null;
  return {title: known ? title : 'Pagina non trovata — Andrea Farao', description, canonical, image, robots, schema, status:known ? 200 : 404, project};
}
export function headMarkup(data) {
  return `<title>${escape(data.title)}</title><meta name="description" content="${escape(data.description)}"><meta name="robots" content="${data.robots}">${data.canonical ? `<link rel="canonical" href="${escape(data.canonical)}">` : ''}<meta property="og:type" content="website"><meta property="og:site_name" content="Andrea Farao"><meta property="og:title" content="${escape(data.title)}"><meta property="og:description" content="${escape(data.description)}">${data.canonical ? `<meta property="og:url" content="${escape(data.canonical)}">` : ''}${data.image ? `<meta property="og:image" content="${escape(data.image)}"><meta property="og:image:alt" content="${escape(data.project?.title)}">` : ''}<meta name="twitter:card" content="${data.image ? 'summary_large_image' : 'summary'}">${data.schema ? `<script id="seo-schema" type="application/ld+json">${json(data.schema)}</script>` : ''}`;
}
export function contentMarkup(data, projects) {
  if (data.status === 404) return '<main><h1>Pagina non trovata</h1><a href="/">Torna al portfolio</a></main>';
  const photo = p => p?.src ? `<img src="${escape(p.src)}" alt="${escape(p.alt)}" loading="lazy" style="max-width:100%;height:auto"${p.width && p.height ? ` width="${Number(p.width)}" height="${Number(p.height)}"` : ''}>` : '';
  return `<div class="portfolio"><header class="site-header"><a class="brand" href="/">ANDREA FARAO</a><nav class="nav"><a href="/projects">Progetti</a><a href="/gallery">Galleria</a><a href="/#contact">Contatti</a></nav></header><main style="padding:100px 5vw"><h1>${escape(data.project?.title || 'Andrea Farao — Fotografo e videomaker | Como, Lecco, Monza e Milano')}</h1><p>${escape(data.description)}</p>${data.project ? (data.project.description ? `<p style="white-space:pre-line">${escape(data.project.description)}</p>` : '') + [data.project.cover,...(data.project.gallery || [])].map(photo).join('') : projects.map(p => `<article><a href="/projects/${encodeURIComponent(p.slug)}"><h2>${escape(p.title)}</h2>${photo(p.cover)}</a></article>`).join('')}<section id="contact"><h2>Contatti / Collaborazioni</h2><a href="mailto:insidefaraostudio@gmail.com">insidefaraostudio@gmail.com</a><p><a href="https://www.instagram.com/inside.faraostudio/">Instagram</a></p></section></main></div>`;
}
export function sitemap(projects, config) {
  if (!config.indexed) return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>';
  const entries = ['/', '/gallery', ...projects.map(p => `/projects/${encodeURIComponent(p.slug)}`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.map(uri => {
    const p = projects.find(p => uri === `/projects/${encodeURIComponent(p.slug)}`);
    const images = [...new Set([p?.cover, ...(p?.gallery || [])].filter(Boolean).map(p => p.src))].slice(0,1000);
    return `<url><loc>${escape(config.origin + uri)}</loc>${images.map(src => `<image:image><image:loc>${escape(new URL(src,config.origin).href)}</image:loc></image:image>`).join('')}</url>`;
  }).join('')}</urlset>`;
}
export function installSeo(app, { publicPath, config = siteConfig() }) {
  const readProjects = async () => JSON.parse(await fs.readFile(path.join(publicPath,'projects.json'),'utf8'));
  app.get('/robots.txt', (_req,res) => res.type('text/plain').set('Cache-Control','no-cache').send(`User-agent: *\nAllow: /\nDisallow: /api/\n${config.indexed ? `Sitemap: ${config.origin}/sitemap.xml\n` : ''}`));
  app.get('/sitemap.xml', async (_req,res,next) => {try {res.type('application/xml').set('Cache-Control','no-cache').send(sitemap(await readProjects(),config));} catch(e) {next(e);}});
  app.get('/api/seo', async (req,res,next) => {try {res.set('Cache-Control','no-store').json(pageData(String(req.query.path || '/'),await readProjects(),config));} catch(e) {next(e);}});
  app.get('*', async (req,res,next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({error:'Not found'});
    try {
      const projects = await readProjects();
      const data = pageData(req.path,projects,config);
      let template = await fs.readFile(path.join(publicPath,'index.html'),'utf8');
      template = template.replace(/<title>[\s\S]*?<\/title>/gi,'').replace(/<meta\s+name="(?:description|robots|googlebot)"[^>]*>/gi,'');
      template = template.replace('</head>',() => headMarkup(data) + '</head>');
      if (req.path !== '/admin') template = template.replace(/<div id="app">[\s\S]*?(?=\s*<script type="module")/, () => `<div id="app">${contentMarkup(data,projects)}</div>`);
      res.status(data.status).type('html').set('Cache-Control','no-cache').set('X-Robots-Tag',data.robots).send(template);
    } catch(e) {next(e);}
  });
}
