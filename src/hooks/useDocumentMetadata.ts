import { useEffect } from 'react';

interface MetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function useDocumentMetadata({ title, description, image, url }: MetadataOptions = {}) {
  useEffect(() => {
    const defaultTitle = 'StayEase — Premium Hotel, Villa & Property Booking Platform';
    const defaultDesc = 'Book hotels, villas, apartments, guest houses and premium accommodations with secure online payment, instant confirmation and professional property management.';
    const defaultImage = 'https://stay-ease-frontend-nu.vercel.app/og-image.jpg';
    const baseUrl = 'https://stay-ease-frontend-nu.vercel.app';
    
    // If a title is provided, format it professionally. If not, use the default title exactly.
    const finalTitle = title ? `${title} | StayEase` : defaultTitle;
    const finalDesc = description || defaultDesc;
    const finalImage = image || defaultImage;
    const finalUrl = url || `${baseUrl}${window.location.pathname}${window.location.search}`;

    // Update document title
    document.title = finalTitle;

    const updateOrCreateMeta = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const nameValue = selector.split("'")[1] || selector.split('"')[1];
          element.setAttribute('name', nameValue);
        } else if (selector.startsWith('meta[property=')) {
          const propValue = selector.split("'")[1] || selector.split('"')[1];
          element.setAttribute('property', propValue);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    updateOrCreateMeta('meta[name="description"]', 'content', finalDesc);
    updateOrCreateMeta('meta[name="title"]', 'content', finalTitle);

    // Open Graph
    updateOrCreateMeta('meta[property="og:title"]', 'content', finalTitle);
    updateOrCreateMeta('meta[property="og:description"]', 'content', finalDesc);
    updateOrCreateMeta('meta[property="og:image"]', 'content', finalImage);
    updateOrCreateMeta('meta[property="og:url"]', 'content', finalUrl);

    // Twitter
    updateOrCreateMeta('meta[name="twitter:title"]', 'content', finalTitle);
    updateOrCreateMeta('meta[name="twitter:description"]', 'content', finalDesc);
    updateOrCreateMeta('meta[name="twitter:image"]', 'content', finalImage);
    updateOrCreateMeta('meta[name="twitter:url"]', 'content', finalUrl);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalUrl);
  }, [title, description, image, url]);
}
