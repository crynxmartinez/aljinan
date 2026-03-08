export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tasheel",
    "legalName": "Tasheel Safety Management Platform",
    "url": "https://tasheel.sa",
    "logo": "https://tasheel.sa/images/logo.png",
    "foundingDate": "2025",
    "founders": [
      {
        "@type": "Person",
        "name": "Hyper Abtahi",
        "jobTitle": "Chief Executive Officer"
      },
      {
        "@type": "Person",
        "name": "Raph-el Martinez",
        "jobTitle": "Chief Technology Officer"
      },
      {
        "@type": "Person",
        "name": "Josh Pescadera",
        "jobTitle": "Chief Financial Officer"
      }
    ],
    "parentOrganization": {
      "@type": "Organization",
      "name": "Jinan Agency",
      "url": "https://www.jinanagency.com",
      "description": "Digital Growth Partner for Medical Clinics"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "King Fahd Road, Al Olaya District",
      "addressLocality": "Riyadh",
      "postalCode": "12213",
      "addressCountry": "SA"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+966-50-123-4567",
      "contactType": "Customer Service",
      "email": "info@tasheel.sa",
      "areaServed": "SA",
      "availableLanguage": ["English", "Arabic"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/tasheel-sa",
      "https://twitter.com/tasheel_sa"
    ],
    "description": "Leading safety management platform for contractors in Saudi Arabia. Streamline inspections, certificates, and compliance."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
