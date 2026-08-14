import * as React from "react"

const MOBILE_BREAKPOINT = 768
const NARROW_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Below the lg breakpoint (phones AND tablets). The map viewer uses this to
 * swap the cramped resizable side panel for an overlaid sheet — the desktop
 * split does not leave enough room for panel content on tablet widths.
 */
export function useIsNarrowScreen() {
  const [isNarrow, setIsNarrow] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsNarrow(window.innerWidth < NARROW_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsNarrow(window.innerWidth < NARROW_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isNarrow
}
