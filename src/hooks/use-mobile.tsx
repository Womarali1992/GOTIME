
import * as React from "react"

const MOBILE_BREAKPOINT = 768

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

// Added useMediaQuery function that accepts a media query string
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const onChange = () => {
      setMatches(mediaQuery.matches)
    }
    
    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Add listener
    mediaQuery.addEventListener("change", onChange)
    
    // Clean up
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [query])

  return matches
}
