import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  schema?: Record<string, any>;
}

export function SEO({ title, description, schema }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | Sampooran Holidays`;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    let scriptTag = document.querySelector('script[id="schema-org"]');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('id', 'schema-org');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      document.title = 'Sampooran Holidays';
    };
  }, [title, description, schema]);

  return null;
}
