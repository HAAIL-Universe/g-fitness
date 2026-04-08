"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PLATFORM_NAME } from "@/lib/platform"

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIntent = searchParams?.get("intent") === "client"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.session) {
        router.push("/dashboard")
      } else {
        router.push("/login?registered=true")
      }
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
          {clientIntent ? "Join as a client" : "Choose how you want to get started"}
        </p>

        {!clientIntent ? (
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Create coach account</h2>
                  <p className="mt-1 text-sm text-gf-muted">
                    Start a coach workspace, invite clients, and manage your portal from admin.
                  </p>
                </div>
                <Link href="/register/coach" className="block">
                  <Button className="w-full">Create Coach Workspace</Button>
                </Link>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Join as client</h2>
                  <p className="mt-1 text-sm text-gf-muted">
                    Most clients join through an invite link from their coach. If your coach asked you to create your portal login directly, continue here.
                  </p>
                </div>
                <div className="space-y-3">
                  <Link href="/register?intent=client" className="block">
                    <Button variant="secondary" className="w-full">Continue as Client</Button>
                  </Link>
                  <Link href="/onboarding" className="block text-center text-sm text-gf-pink hover:underline">
                    Have an invite link? Open client onboarding
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="rounded-lg border border-gf-border bg-gf-surface p-3">
                <p className="text-sm text-white">Client account</p>
                <p className="mt-1 text-xs text-gf-muted">
                  Coaches should use the coach workspace signup instead.
                </p>
              </div>
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
                {loading ? "Creating account..." : "Create Client Account"}
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center text-sm text-gf-muted mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-gf-pink hover:underline">
            Log In
          </a>
        </p>
        {clientIntent && (
          <p className="text-center text-sm text-gf-muted mt-3">
            Need a coach workspace instead?{" "}
            <Link href="/register/coach" className="text-gf-pink hover:underline">
              Create a coach account
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
