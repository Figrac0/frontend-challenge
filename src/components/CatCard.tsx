import type { CSSProperties } from 'react'

import type { CatImage } from '../types'
import { FavoriteButton } from './FavoriteButton'
import { ShareButton } from './ShareButton'

interface CatCardProps {
  cat: CatImage
  displayIndex: number
  isFavorite: boolean
  onOpen: (cat: CatImage) => void
  onShare?: (cat: CatImage) => void
  onToggleFavorite: (cat: CatImage) => void
  showShareAction?: boolean
}

export function CatCard({
  cat,
  displayIndex,
  isFavorite,
  onOpen,
  onShare,
  onToggleFavorite,
  showShareAction = false,
}: CatCardProps) {
  const label = isFavorite
    ? 'Убрать котика из любимых'
    : 'Добавить котика в любимые'

  return (
    <article
      className={`cat-card${isFavorite ? ' cat-card_favorite' : ''}`}
      style={{ '--card-index': String(Math.min(displayIndex, 12)) } as CSSProperties}
    >
      <button
        aria-label="Открыть фото котика"
        className="cat-card__media"
        onClick={() => onOpen(cat)}
        type="button"
      >
        <img
          alt="Фотография кота"
          className="cat-card__image"
          decoding="async"
          loading="lazy"
          src={cat.url}
        />
      </button>

      <div className={`cat-card__actions${showShareAction ? ' cat-card__actions_expanded' : ''}`}>
        {showShareAction && onShare ? (
          <ShareButton
            ariaLabel="Поделиться фото котика"
            onShare={() => onShare(cat)}
            pulse
          />
        ) : null}

        <FavoriteButton
          ariaLabel={label}
          isFavorite={isFavorite}
          onToggle={() => onToggleFavorite(cat)}
        />
      </div>
    </article>
  )
}
