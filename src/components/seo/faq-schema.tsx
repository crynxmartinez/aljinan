export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I sign up for Tasheel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Click the 'Get Started' or 'Sign Up' button on our homepage, fill out the registration form with your company details, and you'll be up and running in under 2 minutes. No credit card required for the free trial."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to set up?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most contractors are fully set up within 30 minutes. You can start creating work orders and adding clients immediately after signing up."
        }
      },
      {
        "@type": "Question",
        "name": "Can my clients access the platform?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Each client gets their own secure portal where they can view projects, certificates, invoices, and communicate with your team 24/7."
        }
      },
      {
        "@type": "Question",
        "name": "Does it work on mobile devices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Tasheel is fully responsive and works seamlessly on smartphones, tablets, and desktops. Perfect for field work."
        }
      },
      {
        "@type": "Question",
        "name": "Can I upload existing certificates and documents?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can easily upload and organize all your existing certificates, inspection reports, and documents into Tasheel."
        }
      },
      {
        "@type": "Question",
        "name": "How does certificate expiry tracking work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tasheel automatically monitors all certificate expiry dates and sends you notifications 30, 14, and 7 days before expiration, ensuring you never miss a renewal."
        }
      },
      {
        "@type": "Question",
        "name": "What payment methods do you accept?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We accept major credit cards (Visa, Mastercard), bank transfers, and STC Pay for your convenience."
        }
      },
      {
        "@type": "Question",
        "name": "Can I cancel anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we use enterprise-grade encryption, secure data centers, and regular backups. Your data is protected with the highest security standards."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
