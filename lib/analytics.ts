import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

function getPostHog() {
  if (typeof window === 'undefined') return null
  if (!POSTHOG_KEY) return null

  if (!initialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: false,
    })
    initialized = true
  }

  return posthog
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  const ph = getPostHog()
  if (!ph) return
  ph.identify(userId, properties)
}

export function track(event: string, properties?: Record<string, unknown>) {
  const ph = getPostHog()
  if (!ph) return
  ph.capture(event, properties)
}
