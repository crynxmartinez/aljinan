/** Apply at every client read path, including search, documents and detail URLs. */
export function publishedFor(role: string) {
  return role === 'CLIENT' ? { status: { not: 'DRAFT' as const } } : {}
}
