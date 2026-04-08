import type { CatBreed, CatCategory, CatImage } from '../types'

const CAT_API_URL = 'https://api.thecatapi.com/v1/images/search'
const MAX_BATCH_SIZE = 20
const MAX_ATTEMPTS = 4

interface ApiCatImage {
  breeds?: CatBreed[]
  categories?: CatCategory[]
  height?: number
  id?: string
  url?: string
  width?: number
}

function toErrorMessage(status: number): string {
  if (status >= 500) {
    return 'Сервис временно недоступен. Попробуй повторить загрузку.'
  }

  if (status === 429) {
    return 'Слишком много запросов. Подожди пару секунд и попробуй снова.'
  }

  return 'Не удалось получить список котиков.'
}

function normalizeCat(image: ApiCatImage): CatImage | null {
  if (!image.id || !image.url) {
    return null
  }

  return {
    id: image.id,
    url: image.url,
    width: image.width ?? 225,
    height: image.height ?? 225,
    breeds: image.breeds ?? [],
    categories: image.categories ?? [],
  }
}

export function warmImageCache(url: string) {
  if (typeof window === 'undefined') {
    return
  }

  const image = new window.Image()
  image.src = url
}

export async function fetchCatsBatch(options: {
  excludeIds?: Iterable<string>
  limit?: number
  signal?: AbortSignal
}): Promise<CatImage[]> {
  const excludeIds = new Set(options.excludeIds ?? [])
  const targetSize = Math.min(Math.max(options.limit ?? 15, 1), MAX_BATCH_SIZE)
  const uniqueCats = new Map<string, CatImage>()
  const apiKey = import.meta.env.VITE_THE_CAT_API_KEY?.trim()

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const remaining = targetSize - uniqueCats.size

    if (remaining <= 0) {
      break
    }

    const url = new URL(CAT_API_URL)
    url.searchParams.set('limit', String(Math.min(remaining + 4, MAX_BATCH_SIZE)))
    url.searchParams.set('mime_types', 'jpg,png')
    url.searchParams.set('size', 'med')
    url.searchParams.set('has_breeds', 'true')

    const response = await fetch(url, {
      headers: apiKey ? { 'x-api-key': apiKey } : undefined,
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(toErrorMessage(response.status))
    }

    const payload = (await response.json()) as ApiCatImage[]

    for (const item of payload) {
      const cat = normalizeCat(item)

      if (!cat || excludeIds.has(cat.id) || uniqueCats.has(cat.id)) {
        continue
      }

      uniqueCats.set(cat.id, cat)
    }

    if (payload.length === 0) {
      break
    }
  }

  return [...uniqueCats.values()]
}
