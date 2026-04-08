import { startTransition, useEffect, useRef, useState } from 'react'

import './App.css'
import { CatCard } from './components/CatCard'
import { CatViewerModal } from './components/CatViewerModal'
import { FavoriteBreedsSummary } from './components/FavoriteBreedsSummary'
import { TabBar } from './components/TabBar'
import { useCatFeed } from './hooks/useCatFeed'
import { useFavorites } from './hooks/useFavorites'
import type { CatImage, TabId } from './types'
import { shareCatImage } from './utils/shareCat'

const SKELETON_COUNT = 10

interface ViewerState {
  catId: string
  sourceTab: TabId
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [viewerState, setViewerState] = useState<ViewerState | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCardHoverSuppressed, setIsCardHoverSuppressed] = useState(false)

  const loaderRef = useRef<HTMLDivElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const { cats, error, hasMore, isInitialLoading, isLoadingMore, loadMore, retry } =
    useCatFeed()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    if (activeTab !== 'all' || !hasMore || isLoadingMore) {
      return
    }

    const currentLoader = loaderRef.current

    if (!currentLoader) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      {
        rootMargin: '320px 0px',
      },
    )

    observer.observe(currentLoader)

    return () => {
      observer.disconnect()
    }
  }, [activeTab, hasMore, isLoadingMore, loadMore])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isCardHoverSuppressed) {
      return
    }

    const handlePointerMove = () => {
      setIsCardHoverSuppressed(false)
    }

    window.addEventListener('pointermove', handlePointerMove, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [isCardHoverSuppressed])

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToastMessage(message)

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 2200)
  }

  const handleTabChange = (tab: TabId) => {
    if (tab === activeTab) {
      return
    }

    startTransition(() => {
      setActiveTab(tab)
    })
  }

  const handleOpenViewer = (sourceTab: TabId, cat: CatImage) => {
    const activeElement = document.activeElement

    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    setIsCardHoverSuppressed(false)
    setViewerState({
      catId: cat.id,
      sourceTab,
    })
  }

  const handleCloseViewer = () => {
    const activeElement = document.activeElement

    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    setViewerState(null)
    setIsCardHoverSuppressed(true)
  }

  const handleViewerToggleFavorite = (cat: CatImage) => {
    if (viewerState?.sourceTab === 'favourites' && isFavorite(cat.id)) {
      const currentIndex = favorites.findIndex(({ id }) => id === cat.id)
      const fallbackCat = favorites[currentIndex + 1] ?? favorites[currentIndex - 1] ?? null

      toggleFavorite(cat)
      setViewerState(
        fallbackCat
          ? {
              sourceTab: 'favourites',
              catId: fallbackCat.id,
            }
          : null,
      )
      return
    }

    toggleFavorite(cat)
  }

  const handleShare = async (cat: CatImage) => {
    try {
      const shareResult = await shareCatImage(cat)

      if (shareResult === 'shared') {
        showToast('Фото готово к отправке')
      }

      if (shareResult === 'copied') {
        showToast('Ссылка на фото скопирована')
      }

      if (shareResult === 'opened') {
        showToast('Фото открыто в новой вкладке')
      }
    } catch {
      showToast('Не получилось поделиться фото')
    }
  }

  const visibleCats = activeTab === 'all' ? cats : favorites
  const viewerCats =
    viewerState?.sourceTab === 'all'
      ? cats
      : viewerState?.sourceTab === 'favourites'
        ? favorites
        : []

  const sectionTitle = activeTab === 'all' ? 'Все котики' : 'Любимые котики'

  return (
    <div className={`app-shell${isCardHoverSuppressed ? ' app-shell_hover-suppressed' : ''}`}>
      <TabBar
        activeTab={activeTab}
        favoritesCount={favorites.length}
        onChange={handleTabChange}
      />

      <main className="page">
        <h1 className="sr-only">Кошачий пинтерест</h1>

        <section>
          <div className="page__header">
            <div>
              <h2 className="page__title">{sectionTitle}</h2>
            </div>

            <div className="page__status">
              {activeTab === 'all' ? `${cats.length} фото` : `${favorites.length} в избранном`}
            </div>
          </div>

          {activeTab === 'favourites' && favorites.length > 0 ? (
            <FavoriteBreedsSummary favorites={favorites} />
          ) : null}

          <div className="page__body" key={activeTab}>
            {activeTab === 'all' && isInitialLoading && cats.length === 0 ? (
              <div className="skeleton-grid" aria-hidden="true">
                {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                  <div className="skeleton-card" key={index} />
                ))}
              </div>
            ) : null}

            {activeTab === 'all' && !isInitialLoading && cats.length === 0 ? (
              <div className="state-card">
                <h2 className="state-card__title">Лента пока пустая</h2>
                <p className="state-card__text">{error ?? 'Не получилось загрузить котиков.'}</p>
                <button className="state-card__action" onClick={retry} type="button">
                  Повторить загрузку
                </button>
              </div>
            ) : null}

            {activeTab === 'favourites' && favorites.length === 0 ? (
              <div className="state-card">
                <h2 className="state-card__title">Любимых котиков пока нет</h2>
                <p className="state-card__text">
                  Переключись на вкладку «Все котики» и добавь изображения сердцем.
                </p>
                <button
                  className="state-card__action"
                  onClick={() => handleTabChange('all')}
                  type="button"
                >
                  Открыть всех котиков
                </button>
              </div>
            ) : null}

            {visibleCats.length > 0 ? (
              <div className="gallery">
                {visibleCats.map((cat, index) => (
                  <CatCard
                    cat={cat}
                    displayIndex={index}
                    isFavorite={isFavorite(cat.id)}
                    key={cat.id}
                    onOpen={() => handleOpenViewer(activeTab, cat)}
                    onShare={handleShare}
                    onToggleFavorite={toggleFavorite}
                    showShareAction={activeTab === 'favourites'}
                  />
                ))}
              </div>
            ) : null}

            {activeTab === 'all' && error && cats.length > 0 ? (
              <div className="load-error" role="status">
                <span>{error}</span>
                <button className="load-error__retry" onClick={retry} type="button">
                  Повторить
                </button>
              </div>
            ) : null}

            {activeTab === 'all' && hasMore && cats.length > 0 ? (
              <div className="load-more" ref={loaderRef}>
                <div className={`loader${isLoadingMore ? ' loader_loading' : ''}`}>
                  {isLoadingMore ? 'Подгружаем следующую пачку котиков' : 'Еще котики уже готовятся ниже'}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {viewerState ? (
        <CatViewerModal
          cats={viewerCats}
          currentId={viewerState.catId}
          isFavorite={isFavorite}
          onClose={handleCloseViewer}
          onSelect={(catId) =>
            setViewerState((currentViewerState) =>
              currentViewerState
                ? {
                    ...currentViewerState,
                    catId,
                  }
                : currentViewerState,
            )
          }
          onShare={handleShare}
          onToggleFavorite={handleViewerToggleFavorite}
        />
      ) : null}

      <div className={`toast${toastMessage ? ' toast_visible' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  )
}

export default App
