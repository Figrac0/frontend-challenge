import { useEffect, useState } from 'react'

const inactiveFavoriteIcon = `${import.meta.env.BASE_URL}favorite_border.png`
const activeFavoriteIcon = `${import.meta.env.BASE_URL}cat-fav.svg`

interface FavoriteButtonProps {
  ariaLabel: string
  className?: string
  isFavorite: boolean
  onToggle: () => void
  size?: 'card' | 'modal'
  visible?: boolean
}

const whiskerOffsets = ['top-left', 'middle-left', 'bottom-left', 'top-right', 'middle-right', 'bottom-right']

export function FavoriteButton({
  ariaLabel,
  className,
  isFavorite,
  onToggle,
  size = 'card',
  visible = false,
}: FavoriteButtonProps) {
  const [isBursting, setIsBursting] = useState(false)

  useEffect(() => {
    if (!isBursting) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsBursting(false)
    }, 650)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isBursting])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!isFavorite) {
      setIsBursting(true)
    }

    onToggle()
  }

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      className={[
        'action-button',
        'action-button_like',
        size === 'modal' ? 'action-button_modal' : '',
        isFavorite ? 'action-button_active' : '',
        visible ? 'action-button_visible' : '',
        isBursting ? 'action-button_burst' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true" className="action-button__whiskers">
        {whiskerOffsets.map((position) => (
          <span className={`action-button__whisker action-button__whisker_${position}`} key={position} />
        ))}
      </span>

      <span className="action-button__icon-shell">
        <img
          alt=""
          aria-hidden="true"
          className={`action-button__icon${isFavorite ? ' action-button__icon_filled' : ''}`}
          src={isFavorite ? activeFavoriteIcon : inactiveFavoriteIcon}
        />
      </span>
    </button>
  )
}
