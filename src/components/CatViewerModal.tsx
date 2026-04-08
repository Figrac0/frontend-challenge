import { useCallback, useEffect, useRef, useState } from 'react'

import { warmImageCache } from '../api/catsApi'
import type { CatImage } from '../types'
import { FavoriteButton } from './FavoriteButton'
import { ShareButton } from './ShareButton'

const SWIPE_THRESHOLD = 110

interface CatViewerModalProps {
  cats: CatImage[]
  currentId: string
  isFavorite: (catId: string) => boolean
  onClose: () => void
  onSelect: (catId: string) => void
  onShare: (cat: CatImage) => void
  onToggleFavorite: (cat: CatImage) => void
}

export function CatViewerModal({
  cats,
  currentId,
  isFavorite,
  onClose,
  onSelect,
  onShare,
  onToggleFavorite,
}: CatViewerModalProps) {
  const currentIndex = cats.findIndex(({ id }) => id === currentId)
  const currentCat = currentIndex >= 0 ? cats[currentIndex] : null

  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [navDirection, setNavDirection] = useState<'next' | 'prev'>('next')

  const pointerStateRef = useRef({
    id: -1,
    startX: 0,
    deltaX: 0,
  })
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < cats.length - 1
  const primaryBreedName = currentCat?.breeds?.[0]?.name ?? null

  const goToIndex = useCallback(
    (targetIndex: number, direction: 'next' | 'prev') => {
      if (targetIndex < 0 || targetIndex >= cats.length) {
        setDragOffset(0)
        setIsDragging(false)
        return
      }

      setNavDirection(direction)
      setDragOffset(0)
      setIsDragging(false)
      onSelect(cats[targetIndex].id)
    },
    [cats, onSelect],
  )

  const goNext = useCallback(() => {
    if (!canGoNext) {
      setDragOffset(0)
      setIsDragging(false)
      return
    }

    goToIndex(currentIndex + 1, 'next')
  }, [canGoNext, currentIndex, goToIndex])

  const goPrev = useCallback(() => {
    if (!canGoPrev) {
      setDragOffset(0)
      setIsDragging(false)
      return
    }

    goToIndex(currentIndex - 1, 'prev')
  }, [canGoPrev, currentIndex, goToIndex])

  useEffect(() => {
    if (!currentCat) {
      return
    }

    warmImageCache(currentCat.url)

    if (canGoNext) {
      warmImageCache(cats[currentIndex + 1].url)
    }

    if (canGoPrev) {
      warmImageCache(cats[currentIndex - 1].url)
    }
  }, [canGoNext, canGoPrev, cats, currentCat, currentIndex])

  useEffect(() => {
    const { body } = document
    const { documentElement } = document
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    const previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
    }

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousStyles.bodyOverflow
      body.style.paddingRight = previousStyles.bodyPaddingRight
      documentElement.style.overflow = previousStyles.htmlOverflow
    }
  }, [])

  useEffect(() => {
    if (!currentCat) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentCat, goNext, goPrev, onClose])

  if (!currentCat) {
    return null
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    pointerStateRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      deltaX: 0,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.id !== event.pointerId) {
      return
    }

    const rawOffset = event.clientX - pointerStateRef.current.startX
    const canMoveInDirection =
      (rawOffset < 0 && canGoNext) || (rawOffset > 0 && canGoPrev)
    const adjustedOffset = canMoveInDirection ? rawOffset : rawOffset * 0.24

    pointerStateRef.current.deltaX = adjustedOffset
    setDragOffset(adjustedOffset)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.id !== event.pointerId) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)

    const { deltaX } = pointerStateRef.current
    pointerStateRef.current = {
      id: -1,
      startX: 0,
      deltaX: 0,
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        goNext()
      } else {
        goPrev()
      }

      return
    }

    setDragOffset(0)
    setIsDragging(false)
  }

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="viewer"
      onMouseDown={handleBackdropMouseDown}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото котика"
    >
      <div className="viewer__dialog">
        <div className="viewer__header">
          <div className="viewer__counter">
            {currentIndex + 1} / {cats.length}
          </div>

          <button
            aria-label="Закрыть просмотр"
            className="viewer__close"
            onClick={onClose}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>

        <div className="viewer__content">
          <button
            aria-label="Предыдущее фото"
            className="viewer__nav viewer__nav_prev"
            disabled={!canGoPrev}
            onClick={goPrev}
            type="button"
          >
            <span />
          </button>

          <div
            className={`viewer__stage-shell${isDragging ? ' viewer__stage-shell_dragging' : ''}`}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
          >
            <div
              className={`viewer__stage viewer__stage_${navDirection}`}
              key={currentCat.id}
              style={isDragging ? { transform: `translateX(${dragOffset}px)` } : undefined}
            >
              <img
                alt="Фотография кота"
                className="viewer__image"
                decoding="async"
                draggable="false"
                src={currentCat.url}
              />
            </div>
          </div>

          <button
            aria-label="Следующее фото"
            className="viewer__nav viewer__nav_next"
            disabled={!canGoNext}
            onClick={goNext}
            type="button"
          >
            <span />
          </button>
        </div>

        <div className="viewer__footer">
          <div className="viewer__meta">
            <span className="viewer__meta-chip">
              {primaryBreedName ? `Порода: ${primaryBreedName}` : 'Порода не указана'}
            </span>
            <span className="viewer__meta-chip">
              {currentCat.width} x {currentCat.height}
            </span>
          </div>

          <div className="viewer__actions">
            <ShareButton
              ariaLabel="Поделиться фото"
              onShare={() => onShare(currentCat)}
              size="modal"
              visible
            />

            <FavoriteButton
              ariaLabel={
                isFavorite(currentCat.id)
                  ? 'Убрать котика из любимых'
                  : 'Добавить котика в любимые'
              }
              isFavorite={isFavorite(currentCat.id)}
              onToggle={() => onToggleFavorite(currentCat)}
              size="modal"
              visible
            />
          </div>
        </div>
      </div>
    </div>
  )
}
