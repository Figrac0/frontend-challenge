import { useEffect, useState } from 'react'

import type { CatImage } from '../types'

const STORAGE_KEY = 'uchiru-cat-pinterest:favourites'

function isCatImage(value: unknown): value is CatImage {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CatImage>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.url === 'string' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number'
  )
}

function readStoredFavorites(): CatImage[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isCatImage)
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<CatImage[]>(() => readStoredFavorites())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return
      }

      setFavorites(readStoredFavorites())
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const isFavorite = (catId: string) => favorites.some(({ id }) => id === catId)

  const toggleFavorite = (cat: CatImage) => {
    setFavorites((currentFavorites) => {
      if (currentFavorites.some(({ id }) => id === cat.id)) {
        return currentFavorites.filter(({ id }) => id !== cat.id)
      }

      return [cat, ...currentFavorites]
    })
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
  }
}
