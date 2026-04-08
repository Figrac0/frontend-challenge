import { startTransition, useCallback, useEffect, useRef, useState } from 'react'

import { fetchCatsBatch, warmImageCache } from '../api/catsApi'
import type { CatImage } from '../types'

const BATCH_SIZE = 15

function toUiError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Не удалось загрузить котиков. Попробуй еще раз.'
}

export function useCatFeed() {
  const [cats, setCats] = useState<CatImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const prefetchControllerRef = useRef<AbortController | null>(null)
  const prefetchPromiseRef = useRef<Promise<void> | null>(null)
  const prefetchedCatsRef = useRef<CatImage[]>([])
  const hasMoreRef = useRef(true)
  const isFetchingRef = useRef(false)
  const seenIdsRef = useRef(new Set<string>())

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const appendCats = useCallback((nextCats: CatImage[]) => {
    nextCats.forEach(({ id, url }) => {
      seenIdsRef.current.add(id)
      warmImageCache(url)
    })

    startTransition(() => {
      setCats((currentCats) => [...currentCats, ...nextCats])
    })
  }, [])

  const stopLoadingState = useCallback(() => {
    isFetchingRef.current = false
    setIsInitialLoading(false)
    setIsLoadingMore(false)
  }, [])

  const schedulePrefetch = useCallback(() => {
    if (prefetchPromiseRef.current || !hasMoreRef.current) {
      return
    }

    const controller = new AbortController()
    prefetchControllerRef.current = controller

    prefetchPromiseRef.current = fetchCatsBatch({
      excludeIds: seenIdsRef.current,
      limit: BATCH_SIZE,
      signal: controller.signal,
    })
      .then((prefetchedCats) => {
        if (controller.signal.aborted) {
          return
        }

        prefetchedCatsRef.current = prefetchedCats
        prefetchedCats.forEach(({ url }) => {
          warmImageCache(url)
        })

        if (prefetchedCats.length === 0) {
          setHasMore(false)
          hasMoreRef.current = false
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          prefetchedCatsRef.current = []
        }
      })
      .finally(() => {
        if (prefetchControllerRef.current === controller) {
          prefetchControllerRef.current = null
        }

        prefetchPromiseRef.current = null
      })
  }, [])

  const takePrefetchedCats = useCallback(() => {
    const nextCats = prefetchedCatsRef.current
    prefetchedCatsRef.current = []
    return nextCats
  }, [])

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) {
      return
    }

    isFetchingRef.current = true
    setError(null)

    const isFirstBatch = seenIdsRef.current.size === 0

    if (isFirstBatch) {
      setIsInitialLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (prefetchPromiseRef.current) {
        await prefetchPromiseRef.current
      }

      let nextCats = takePrefetchedCats()

      if (nextCats.length === 0) {
        nextCats = await fetchCatsBatch({
          excludeIds: seenIdsRef.current,
          limit: BATCH_SIZE,
          signal: controller.signal,
        })
      }

      if (controller.signal.aborted) {
        return
      }

      if (nextCats.length === 0) {
        setHasMore(false)
        hasMoreRef.current = false

        if (isFirstBatch) {
          setError('Сейчас не получилось загрузить изображения. Попробуй еще раз.')
        }

        stopLoadingState()
        return
      }

      appendCats(nextCats)

      if (nextCats.length < BATCH_SIZE) {
        setHasMore(false)
        hasMoreRef.current = false
      }

      stopLoadingState()
      schedulePrefetch()
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(toUiError(requestError))
        stopLoadingState()
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [appendCats, schedulePrefetch, stopLoadingState, takePrefetchedCats])

  useEffect(() => {
    void loadMore()

    return () => {
      abortControllerRef.current?.abort()
      prefetchControllerRef.current?.abort()
      abortControllerRef.current = null
      prefetchControllerRef.current = null
      prefetchPromiseRef.current = null
      prefetchedCatsRef.current = []
      isFetchingRef.current = false
    }
  }, [loadMore])

  const retry = useCallback(() => {
    void loadMore()
  }, [loadMore])

  return {
    cats,
    error,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    loadMore,
    retry,
  }
}
