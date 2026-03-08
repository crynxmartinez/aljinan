import { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Terms of Service | Tasheel',
  description: 'Tasheel\'s terms of service and user agreement.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="marketing" />
      <main className="flex-1 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 9, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Tasheel, you accept and agree to be bound by the terms and provisions 
                of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily access Tasheel for personal, non-commercial transitory 
                viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Account</h2>
              <p className="text-muted-foreground mb-4">To use Tasheel, you must:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Upload malicious code or viruses</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Payment Terms</h2>
              <p className="text-muted-foreground">
                Subscription fees are billed in advance on a monthly or annual basis. All fees are 
                non-refundable except as required by law. We reserve the right to change our pricing 
                with 30 days notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The service and its original content, features, and functionality are owned by Tasheel 
                and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account immediately, without prior notice, for any reason, 
                including breach of these Terms. Upon termination, your right to use the service will 
                immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Tasheel be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by the laws of Saudi Arabia, without regard to its conflict 
                of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes via email or through the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground mt-4">
                Email: legal@tasheel.sa<br />
                Phone: +966 50 123 4567<br />
                Address: King Fahd Road, Riyadh 12345, Saudi Arabia
              </p>
            </section>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
