import { X, Check } from 'lucide-react'

export function ProblemSolution() {
  const problems = [
    'Manual tracking leads to missed inspections',
    'Lost certificates and compliance headaches',
    'Slow communication frustrates clients',
  ]

  const solutions = [
    'Automated reminders and scheduling',
    'Centralized certificate management',
    'Real-time client portal access',
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Problem Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Juggling Spreadsheets, Emails, and Phone Calls
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Problems */}
            <div className="flex-1 space-y-4 w-full">
              {problems.map((problem, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{problem}</p>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <div className="hidden md:block text-5xl text-orange-500 font-bold">→</div>
              <div className="md:hidden text-4xl text-orange-500 font-bold">↓</div>
            </div>

            {/* Solutions */}
            <div className="flex-1 space-y-4 w-full">
              <h3 className="text-2xl font-bold text-center md:text-left mb-6">
                Tasheel Makes It Easy
              </h3>
              {solutions.map((solution, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
