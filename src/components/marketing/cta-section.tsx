import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Simplify Your Safety Operations?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-orange-50">
            Join leading contractors who trust Tasheel for their business
          </p>
          
          <Button 
            size="lg" 
            className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto"
            asChild
          >
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="text-sm text-orange-100 mt-6">
            No credit card required • Free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
