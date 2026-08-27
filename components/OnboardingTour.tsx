'use client'

import { useState, useEffect } from 'react'
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride'

const TOUR_SEEN_KEY = 'appforge-tour-seen'

const TOUR_STEPS: Step[] = [
  {
    target: '.pipeline-beam',
    content:
      'This is the 6-stage compilation pipeline. Each step validates its input before the next stage runs.',
    title: 'Meet the Pipeline',
    placement: 'bottom',
  },
  {
    target: '[data-tour="example-prompt"]',
    content:
      'Try a pre-built example prompt to see AppForge in action without typing anything.',
    title: 'Try an Example Prompt',
    placement: 'bottom',
  },
  {
    target: 'section:nth-of-type(3)',
    content:
      'Watch as the compiler transforms your idea into schemas, APIs, and components in real time.',
    title: 'See Your Output',
    placement: 'top',
  },
  {
    target: 'section:nth-of-type(4)',
    content:
      'When the compile finishes, export a Prisma schema, Express server, or full scaffold — or deploy straight to Vercel.',
    title: 'Export or Deploy',
    placement: 'top',
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

  const handleCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false)
      try {
        localStorage.setItem(TOUR_SEEN_KEY, '1')
      } catch {
        // silently ignore
      }
    }
  }

  if (!run) return null

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'var(--fill-accent, #6366f1)',
          textColor: '#f1f5f9',
          backgroundColor: '#0f172a',
          overlayColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: 12,
        },
        buttonNext: {
          borderRadius: 8,
          padding: '6px 16px',
        },
        buttonSkip: {
          color: '#94a3b8',
        },
      }}
      locale={{
        last: 'Got it',
        skip: 'Skip tour',
        next: 'Next',
      }}
    />
  )
}
