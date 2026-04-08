import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { TabId } from '../types'

interface TabBarProps {
  activeTab: TabId
  favoritesCount: number
  onChange: (tab: TabId) => void
}

export function TabBar({ activeTab, favoritesCount, onChange }: TabBarProps) {
  const allButtonRef = useRef<HTMLButtonElement | null>(null)
  const favoritesButtonRef = useRef<HTMLButtonElement | null>(null)
  const tabsRef = useRef<HTMLElement | null>(null)

  const [isDetached, setIsDetached] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    x: 0,
  })

  useEffect(() => {
    let frameId = 0

    const updateDetachedState = () => {
      frameId = 0
      const nextDetachedState = window.scrollY > 12

      setIsDetached((currentState) =>
        currentState === nextDetachedState ? currentState : nextDetachedState,
      )
    }

    const handleScroll = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateDetachedState)
    }

    updateDetachedState()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const updateIndicator = () => {
      const activeButton =
        activeTab === 'all' ? allButtonRef.current : favoritesButtonRef.current

      if (!activeButton) {
        return
      }

      setIndicatorStyle({
        width: activeButton.offsetWidth,
        x: activeButton.offsetLeft,
      })
    }

    updateIndicator()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateIndicator)
        : null

    if (tabsRef.current) {
      resizeObserver?.observe(tabsRef.current)
    }

    if (allButtonRef.current) {
      resizeObserver?.observe(allButtonRef.current)
    }

    if (favoritesButtonRef.current) {
      resizeObserver?.observe(favoritesButtonRef.current)
    }

    window.addEventListener('resize', updateIndicator)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeTab, favoritesCount])

  return (
    <header className={`topbar${isDetached ? ' topbar_detached' : ''}`}>
      <div className="topbar__inner">
        <nav
          aria-label="Навигация по галерее котиков"
          className={`tabs${isDetached ? ' tabs_detached' : ''}`}
          ref={tabsRef}
        >
          <span
            aria-hidden="true"
            className="tabs__highlight"
            style={
              {
                '--tabs-indicator-width': `${indicatorStyle.width}px`,
                '--tabs-indicator-x': `${indicatorStyle.x}px`,
              } as CSSProperties
            }
          />

          <button
            className={`tabs__button${activeTab === 'all' ? ' tabs__button_active' : ''}`}
            onClick={() => onChange('all')}
            ref={allButtonRef}
            type="button"
          >
            Все котики
          </button>

          <button
            className={`tabs__button${activeTab === 'favourites' ? ' tabs__button_active' : ''}`}
            onClick={() => onChange('favourites')}
            ref={favoritesButtonRef}
            type="button"
          >
            Любимые котики
            <span aria-hidden="true" className="tabs__counter">
              {favoritesCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  )
}
