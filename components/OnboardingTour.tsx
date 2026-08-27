'use client'

import { useState, useEffect } from 'react'
import { Joyride, EVENTS, STATUS } from 'react-joyride'

const TOUR_SEEN_KEY = 'appforge-tour-seen'

const TOUR_STEPS = [
  {
    target: '.pipeline-beam',
    content:
      'This is the 6-stage compilation pipeline. Each step validates its input before the next stage runs.',
    title: 'Meet the Pipeline',
    placement: 'bottom' as const,
  },
  {
    target: '[data-tour="example-prompt"]',
    content:
      'Try a pre-built example prompt to see AppForge in action without typing anything.',
    title: 'Try an Example Prompt',
    placement: 'bottom' as const,
  },
  {
    target: 'section:nth-of-type(3)',
    content:
      'Watch as the compiler transforms your idea into schemas, APIs, and components in real time.',
    title: 'See Your Output',
    placement: 'top' as const,
  },
  {
    target: 'section:nth-of-type(4)',
    content:
      'When the compile finishes, export a Prisma schema, Express server, or full scaffold — or deploy straight to Vercel.',
    title: 'Export or Deploy',
    placement: 'top' as const,
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
        primaryColor: 'var(--fill-accent, #6366f1)',
        textColor: '#f1f5f9',
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
