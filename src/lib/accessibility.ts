/**
 * Accessibility Utilities
 * 
 * Helpers for ARIA attributes, keyboard navigation, and screen reader support
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

/**
 * ARIA live region announcer for screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return

  const announcer = document.getElementById('aria-live-announcer') || createAnnouncer()
  announcer.setAttribute('aria-live', priority)
  announcer.textContent = message

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = ''
  }, 1000)
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div')
  announcer.id = 'aria-live-announcer'
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  document.body.appendChild(announcer)
  return announcer
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

export function isEnterOrSpace(event: React.KeyboardEvent): boolean {
  return event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE
}

export function isArrowKey(event: React.KeyboardEvent): boolean {
  return [
    KeyboardKeys.ARROW_UP,
    KeyboardKeys.ARROW_DOWN,
    KeyboardKeys.ARROW_LEFT,
    KeyboardKeys.ARROW_RIGHT,
  ].includes(event.key as any)
}

/**
 * Focus management
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== KeyboardKeys.TAB) return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

export function focusFirstElement(container: HTMLElement): void {
  const focusable = container.querySelector<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  focusable?.focus()
}

export function restoreFocus(previousElement: HTMLElement | null): void {
  previousElement?.focus()
}

/**
 * ARIA attribute helpers
 */
export function getAriaProps(options: {
  label?: string
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  busy?: boolean
  controls?: string
  owns?: string
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  pressed?: boolean
  checked?: boolean | 'mixed'
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
}) {
  const props: Record<string, any> = {}

  if (options.label) props['aria-label'] = options.label
  if (options.labelledBy) props['aria-labelledby'] = options.labelledBy
  if (options.describedBy) props['aria-describedby'] = options.describedBy
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded
  if (options.selected !== undefined) props['aria-selected'] = options.selected
  if (options.disabled !== undefined) props['aria-disabled'] = options.disabled
  if (options.required !== undefined) props['aria-required'] = options.required
  if (options.invalid !== undefined) props['aria-invalid'] = options.invalid
  if (options.hidden !== undefined) props['aria-hidden'] = options.hidden
  if (options.live) props['aria-live'] = options.live
  if (options.atomic !== undefined) props['aria-atomic'] = options.atomic
  if (options.busy !== undefined) props['aria-busy'] = options.busy
  if (options.controls) props['aria-controls'] = options.controls
  if (options.owns) props['aria-owns'] = options.owns
  if (options.haspopup !== undefined) props['aria-haspopup'] = options.haspopup
  if (options.pressed !== undefined) props['aria-pressed'] = options.pressed
  if (options.checked !== undefined) props['aria-checked'] = options.checked
  if (options.current !== undefined) props['aria-current'] = options.current

  return props
}

/**
 * Screen reader only CSS class
 */
export const SR_ONLY_CLASS = 'sr-only'

/**
 * Get props for screen reader only element
 */
export function getSrOnlyProps() {
  return {
    className: SR_ONLY_CLASS,
  }
}

/**
 * Skip to main content link
 */
export function createSkipLink(): void {
  if (typeof window === 'undefined') return
  if (document.getElementById('skip-to-main')) return

  const skipLink = document.createElement('a')
  skipLink.id = 'skip-to-main'
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded'
  
  document.body.insertBefore(skipLink, document.body.firstChild)
}

/**
 * Check color contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation (would need full implementation)
    // This is a placeholder - use a proper color library in production
    return 0.5
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
}

export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7
}

/**
 * Reduce motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Form validation announcements
 */
export function announceFormError(fieldName: string, error: string): void {
  announceToScreenReader(`${fieldName}: ${error}`, 'assertive')
}

export function announceFormSuccess(message: string = 'Form submitted successfully'): void {
  announceToScreenReader(message, 'polite')
}

/**
 * Loading state announcements
 */
export function announceLoading(message: string = 'Loading'): void {
  announceToScreenReader(message, 'polite')
}

export function announceLoadingComplete(message: string = 'Loading complete'): void {
  announceToScreenReader(message, 'polite')
}

/**
 * Navigation announcements
 */
export function announceNavigation(pageName: string): void {
  announceToScreenReader(`Navigated to ${pageName}`, 'polite')
}

/**
 * Action announcements
 */
export function announceAction(action: string, result: 'success' | 'error', message?: string): void {
  const announcement = message || `${action} ${result === 'success' ? 'successful' : 'failed'}`
  announceToScreenReader(announcement, result === 'error' ? 'assertive' : 'polite')
}

/**
 * Table accessibility helpers
 */
export function getTableAriaProps(options: {
  rowCount?: number
  columnCount?: number
  rowIndex?: number
  columnIndex?: number
  sortDirection?: 'ascending' | 'descending' | 'none'
}) {
  const props: Record<string, any> = {}

  if (options.rowCount !== undefined) props['aria-rowcount'] = options.rowCount
  if (options.columnCount !== undefined) props['aria-colcount'] = options.columnCount
  if (options.rowIndex !== undefined) props['aria-rowindex'] = options.rowIndex
  if (options.columnIndex !== undefined) props['aria-colindex'] = options.columnIndex
  if (options.sortDirection) props['aria-sort'] = options.sortDirection

  return props
}

/**
 * Dialog/Modal accessibility
 */
export function setupDialogAccessibility(dialogElement: HTMLElement): () => void {
  const previousActiveElement = document.activeElement as HTMLElement
  
  // Set initial focus
  focusFirstElement(dialogElement)
  
  // Trap focus
  const cleanupFocusTrap = trapFocus(dialogElement)
  
  // Handle escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === KeyboardKeys.ESCAPE) {
      const closeButton = dialogElement.querySelector<HTMLElement>('[data-dialog-close]')
      closeButton?.click()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  // Return cleanup function
  return () => {
    cleanupFocusTrap()
    document.removeEventListener('keydown', handleEscape)
    restoreFocus(previousActiveElement)
  }
}
