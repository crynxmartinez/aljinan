export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Tasheel",
    "image": "https://tasheel.sa/images/og-image.jpg",
    "@id": "https://tasheel.sa",
    "url": "https://tasheel.sa",
    "telephone": "+966-50-123-4567",
    "email": "info@tasheel.sa",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "King Fahd Road, Al Olaya District, Office 405",
      "addressLocality": "Riyadh",
      "postalCode": "12213",
      "addressRegion": "Riyadh Province",
      "addressCountry": "SA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 24.7136,
      "longitude": 46.6753
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday"
        ],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/company/tasheel-sa",
      "https://twitter.com/tasheel_sa"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "52"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
