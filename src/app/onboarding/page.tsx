"use client"

import dynamic from "next/dynamic"

const OnboardingContent = dynamic(
  () => import("@/components/onboarding-content"),
  { ssr: false }
)

export default function OnboardingPage() {
  return <OnboardingContent />
}
