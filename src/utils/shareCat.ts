import type { CatImage } from '../types'

export type ShareResult = 'shared' | 'copied' | 'opened' | 'cancelled'

export async function shareCatImage(cat: CatImage): Promise<ShareResult> {
  const shareData = {
    title: 'Кошачий пинтерест',
    text: 'Посмотри на этого котика',
    url: cat.url,
  }

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(cat.url)
      return 'copied'
    } catch {
      // Ignore clipboard failure and fall back to a new tab.
    }
  }

  if (typeof window !== 'undefined') {
    window.open(cat.url, '_blank', 'noopener,noreferrer')
  }

  return 'opened'
}
