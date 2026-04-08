interface ShareButtonProps {
  ariaLabel: string
  className?: string
  onShare: () => void
  pulse?: boolean
  size?: 'card' | 'modal'
  visible?: boolean
}

export function ShareButton({
  ariaLabel,
  className,
  onShare,
  pulse = false,
  size = 'card',
  visible = false,
}: ShareButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onShare()
  }

  return (
    <button
      aria-label={ariaLabel}
      className={[
        'action-button',
        'action-button_share',
        pulse ? 'action-button_pulse' : '',
        size === 'modal' ? 'action-button_modal' : '',
        visible ? 'action-button_visible' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="action-button__share-icon"
        viewBox="0 0 24 24"
      >
        <path
          d="M13.5 5.5 19 11l-5.5 5.5M18.25 11H10a5.5 5.5 0 0 0 0 11H12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
        />
      </svg>
    </button>
  )
}
