"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function BillingActions({ status }: { status: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function openPortal() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Something went wrong")
        setLoading(false)
      }
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  async function addPaymentMethod() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Something went wrong")
        setLoading(false)
      }
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {status === "trialing" && (
        <Button onClick={addPaymentMethod} disabled={loading} className="w-full">
          {loading ? "Redirecting..." : "Add Payment Method"}
        </Button>
      )}
      {(status === "active" || status === "trialing") && (
        <Button
          onClick={openPortal}
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          {loading ? "Redirecting..." : "Manage Billing"}
        </Button>
      )}
      {(status === "past_due" || status === "canceled") && (
        <Button onClick={openPortal} disabled={loading} className="w-full">
          {loading ? "Redirecting..." : "Update Payment Method"}
        </Button>
      )}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  )
}
