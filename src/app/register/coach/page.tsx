"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PLATFORM_NAME } from "@/lib/platform"
import { COACH_TYPE_PRESETS } from "@/lib/modules"

const COACH_TYPE_OPTIONS = [
  { value: "personal_trainer", label: "Personal trainer" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "wellness_coach", label: "Wellness coach" },
  { value: "sports_performance_coach", label: "Sports performance coach" },
  { value: "yoga_pilates_instructor", label: "Yoga / Pilates instructor" },
  { value: "gym_studio_owner", label: "Gym / studio owner" },
] as const

export default function RegisterCoachPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [coachTypePreset, setCoachTypePreset] = useState<(typeof COACH_TYPE_PRESETS)[number]>("personal_trainer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, coach_type_preset: coachTypePreset }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      router.push("/login?registered=coach")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">
          {PLATFORM_NAME}
        </h1>
        <p className="text-gf-muted text-center text-sm mb-8">
          Create your coach workspace
        </p>

        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <div className="space-y-1.5">
              <label htmlFor="coach-type-preset" className="block text-sm font-medium text-gf-muted">
                Coach Type
              </label>
              <select
                id="coach-type-preset"
                value={coachTypePreset}
                onChange={(e) => setCoachTypePreset(e.target.value as (typeof COACH_TYPE_PRESETS)[number])}
                className="w-full bg-gf-surface border border-gf-border rounded-lg px-4 py-2.5 text-white transition-colors focus:outline-none focus:border-gf-pink focus:ring-1 focus:ring-gf-pink/30"
              >
                {COACH_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gf-muted">
                This sets your starting workspace preset. You can enable more modules later.
              </p>
            </div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type your password again"
              required
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create Coach Workspace"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gf-muted mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-gf-pink hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  )
}
