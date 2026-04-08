import type { CatBreed, CatImage } from '../types'

interface RankedBreed {
  count: number
  latestIndex: number
  name: string
  sampleBreed: CatBreed
}

interface FavoriteBreedsSummaryProps {
  favorites: CatImage[]
}

function getLikeLabel(count: number): string {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} лайков`
  }

  if (lastDigit === 1) {
    return `${count} лайк`
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} лайка`
  }

  return `${count} лайков`
}

function getTopBreeds(favorites: CatImage[]): RankedBreed[] {
  const breedsMap = new Map<string, RankedBreed>()

  favorites.forEach((cat, index) => {
    const primaryBreed = cat.breeds?.[0]

    if (!primaryBreed?.name) {
      return
    }

    const existingBreed = breedsMap.get(primaryBreed.name)

    if (existingBreed) {
      existingBreed.count += 1
      existingBreed.latestIndex = Math.min(existingBreed.latestIndex, index)
      return
    }

    breedsMap.set(primaryBreed.name, {
      count: 1,
      latestIndex: index,
      name: primaryBreed.name,
      sampleBreed: primaryBreed,
    })
  })

  return [...breedsMap.values()]
    .sort(
      (leftBreed, rightBreed) =>
        rightBreed.count - leftBreed.count ||
        leftBreed.latestIndex - rightBreed.latestIndex ||
        leftBreed.name.localeCompare(rightBreed.name, 'ru'),
    )
    .slice(0, 5)
}

export function FavoriteBreedsSummary({ favorites }: FavoriteBreedsSummaryProps) {
  const topBreeds = getTopBreeds(favorites)

  if (topBreeds.length === 0) {
    return null
  }

  return (
    <section className="favorite-breeds" aria-labelledby="favorite-breeds-title">
      <div className="favorite-breeds__header">
        <h3 className="favorite-breeds__title" id="favorite-breeds-title">
          Топ 5 ваших любимых пород
        </h3>
        <p className="favorite-breeds__subtitle">
          Чем чаще порода встречается в избранном, тем выше она в рейтинге.
        </p>
      </div>

      <div className="favorite-breeds__grid">
        {topBreeds.map((breed, index) => (
          <article className="favorite-breed-card" key={breed.name}>
            <div className="favorite-breed-card__rank">Топ {index + 1}</div>
            <div className="favorite-breed-card__name">{breed.name}</div>
            <div className="favorite-breed-card__meta">{getLikeLabel(breed.count)}</div>
            {breed.sampleBreed.origin ? (
              <div className="favorite-breed-card__chip">{breed.sampleBreed.origin}</div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
