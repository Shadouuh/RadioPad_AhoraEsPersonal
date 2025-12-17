import { useCallback, useEffect, useMemo, useState } from 'react'

export function useApiList(fetcher, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadIndex, setReloadIndex] = useState(0)

  const depKey = useMemo(() => JSON.stringify(deps), [deps])

  const refetch = useCallback(() => {
    setReloadIndex((x) => x + 1)
  }, [])

  useEffect(() => {
    let alive = true

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetcher()
        if (!alive) return
        setData(Array.isArray(result) ? result : [])
      } catch (e) {
        if (!alive) return
        setError(e)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    run()

    return () => {
      alive = false
    }
  }, [fetcher, depKey, reloadIndex])

  return { data, loading, error, refetch }
}
