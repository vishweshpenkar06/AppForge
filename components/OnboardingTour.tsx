'use client'

import { useState, useEffect } from 'react'
import { Joyride, EVENTS, STATUS } from 'react-joyride'

const TOUR_SEEN_KEY = 'appforge-tour-seen'

const TOUR_STEPS = [
  {
    target: '[data-tour="stats"]',
    content: 'These are your live workspace numbers — compilations, success rate, latency and token usage.',
    title: 'Your workspace',
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="new-compile"]',
    content: 'Describe an app here. Pick a quality mode, then hit Generate — or press ⌘/Ctrl + Enter.',
    title: 'Start a compilation',
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="history"]',
    content: 'Every compilation is saved here. Click one to inspect its generated config.',
    title: 'Your history',
    placement: 'left' as const,
  },
]

export default function OnboardingTour() {
  const [run, setRun] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) {
        setRun(true)
      }
    } catch {
      // localStorage unavailable (SSR / private browsing edge case)
    }
  }, [])

  const handleEvent = (data: { type: string; status?: string }) => {
    if (data.type === EVENTS.TOUR_STATUS && data.status === STATUS.SKIPPED) {
      finishTour()
    } else if (data.type === EVENTS.TOUR_END) {
      finishTour()
    }
  }

  const finishTour = () => {
    setRun(false)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // silently ignore
    }
  }

  if (!run) return null

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        backgroundColor: '#0f172a',
        overlayColor: 'rgba(0,0,0,0.6)',
        primaryColor: 'var(--fill-accent, #10b981)',
        textColor: '#f1f5f9',
        spotlightRadius: 12,
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  )
}
