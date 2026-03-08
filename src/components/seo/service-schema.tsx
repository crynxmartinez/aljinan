export function ServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Safety Management Software",
    "provider": {
      "@type": "Organization",
      "name": "Tasheel",
      "url": "https://tasheel.sa"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Saudi Arabia"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Safety Management Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Work Order Management",
            "description": "Create, assign, and track safety inspection work orders with automated scheduling and notifications."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Certificate Compliance Tracking",
            "description": "Automated tracking of safety certificates with expiry notifications and renewal management for fire safety, HVAC, and electrical systems."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Equipment Inspection Management",
            "description": "Track fire extinguishers, HVAC systems, electrical equipment with maintenance schedules and inspection history."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Client Portal",
            "description": "Secure portal for clients to view projects, certificates, invoices, and communicate with contractors 24/7."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Professional Inspection Reports",
            "description": "Automated PDF reports with photos, findings, recommendations, and digital signatures."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Integrated Billing",
            "description": "Automated invoice generation, payment tracking, and financial reporting for safety contractors."
          }
        }
      ]
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "SAR",
      "description": "14-day free trial available. No credit card required."
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
