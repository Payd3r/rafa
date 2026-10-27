import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const controller = new AbortController();
    // Prevent metadata from the previous route surviving while the request runs.
    document.querySelectorAll('link[rel="canonical"],meta[property^="og:"],meta[name^="twitter:"],#seo-schema').forEach(node => node.remove());
    const meta = (key: string, value: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.append(node); }
      node.content = value;
    };
    meta('robots', 'noindex, follow');
    document.querySelector('meta[name="googlebot"]')?.remove();
    fetch(`/api/seo?path=${encodeURIComponent(pathname)}`, {signal:controller.signal})
      .then(response => {if (!response.ok) throw new Error('SEO metadata unavailable'); return response.json();})
      .then(data => {
        if (controller.signal.aborted) return;
        document.title = data.title;
        meta('description', data.description); meta('robots', data.robots);
        meta('og:title', data.title, true); meta('og:description', data.description, true);
        meta('og:type', 'website', true); meta('og:site_name', 'Andrea Farao', true);
        meta('twitter:card', data.image ? 'summary_large_image' : 'summary');
        if (data.canonical) { const node = document.createElement('link'); node.rel = 'canonical'; node.href = data.canonical; document.head.append(node); meta('og:url', data.canonical, true); }
        if (data.image) {
          meta('og:image', data.image, true); meta('og:image:secure_url', data.image, true);
          meta('og:image:alt', data.imageAlt, true); meta('og:image:type', data.imageType, true);
          meta('og:image:width', String(data.imageWidth), true); meta('og:image:height', String(data.imageHeight), true);
          meta('twitter:image', data.image); meta('twitter:image:alt', data.imageAlt);
        }
        if (data.schema) {const node = document.createElement('script'); node.id = 'seo-schema'; node.type = 'application/ld+json'; node.textContent = JSON.stringify(data.schema); document.head.append(node);}
      }).catch(() => { /* Keep noindex when metadata cannot be verified. */ });
    return () => controller.abort();
  }, [pathname]);
  return null;
}
