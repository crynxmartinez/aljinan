import { Star } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      quote: "Tasheel transformed how we manage our safety operations. What used to take hours now takes minutes. Our clients love the transparency.",
      author: "Ahmed Al-Rashid",
      company: "Safety First Contracting",
      rating: 5,
    },
    {
      quote: "The certificate tracking feature alone is worth it. We haven't missed a single renewal since switching to Tasheel.",
      author: "Fatima Al-Mansour",
      company: "Guardian Safety Systems",
      rating: 5,
    },
    {
      quote: "Our clients are happier, our team is more efficient, and we're growing faster. Tasheel made it all possible.",
      author: "Mohammed Al-Zahrani",
      company: "Elite Safety Solutions",
      rating: 5,
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Safety Professionals
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what contractors are saying about Tasheel
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-lg border hover:shadow-md transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 mb-6 italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="border-t pt-4">
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
