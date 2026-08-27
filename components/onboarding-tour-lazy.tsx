'use client'

import dynamic from 'next/dynamic'

const OnboardingTour = dynamic(
  () => import('@/components/OnboardingTour').then((m) => m.default),
  { ssr: false }
)

export function OnboardingTourLazy(props: React.ComponentProps<typeof OnboardingTour>) {
  return <OnboardingTour {...props} />
}
