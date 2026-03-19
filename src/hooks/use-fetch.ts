'use client'

import { useState, useEffect, useCallback } from 'react'

export function useFetch<T>(url: string, options?: { skip?: boolean }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options?.skip)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao carregar dados')
      }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (!options?.skip) fetchData()
  }, [fetchData, options?.skip])

  return { data, loading, error, refetch: fetchData }
}
