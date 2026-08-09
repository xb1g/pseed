"use client"

import { useEffect } from 'react'

/**
 * Development-only cleanup: unregister service workers left behind by older
 * versions of the app and wipe their caches. The stale worker intercepts
 * image/asset requests with cache-first logic and breaks localhost pages
 * (most visibly in Safari, where images hang on a loading spinner).
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      .catch(() => {})

    if ('caches' in window) {
      caches
        .keys()
        .then((names) => names.forEach((name) => caches.delete(name)))
        .catch(() => {})
    }
  }, [])

  return null
}
