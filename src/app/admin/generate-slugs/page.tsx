'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function GenerateSlugsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateSlugs = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/generate-slugs', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate slugs')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Generate Slugs for Clients & Branches</CardTitle>
          <CardDescription>
            This will generate URL-friendly slugs for all clients and branches that don't have one yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGenerateSlugs} 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Slugs
          </Button>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Success!</p>
                  <p className="text-sm text-green-700">{result.message}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Clients Updated</CardTitle>
                    <CardDescription>{result.clientsUpdated} clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.clients.length > 0 ? (
                      <ul className="space-y-2">
                        {result.clients.map((client: any, i: number) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{client.name}</span>
                            <br />
                            <span className="text-muted-foreground">→ {client.slug}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No clients needed slugs</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Branches Updated</CardTitle>
                    <CardDescription>{result.branchesUpdated} branches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.branches.length > 0 ? (
                      <ul className="space-y-2">
                        {result.branches.map((branch: any, i: number) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{branch.name}</span>
                            <br />
                            <span className="text-muted-foreground">→ {branch.slug}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No branches needed slugs</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Next step:</strong> Refresh any open pages to see the new clean URLs!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
