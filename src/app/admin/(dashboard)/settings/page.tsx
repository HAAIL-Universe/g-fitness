"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, CheckCircle, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    checkConnection()
    fetchProfile()
  }, [])

  function checkConnection() {
    fetch("/api/google/connect")
      .then((res) => res.json())
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false))
  }

  function fetchProfile() {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        setDisplayName(data.display_name ?? "")
        setBusinessName(data.business_name ?? "")
      })
      .catch(() => {})
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSaved(false)
    setProfileError("")
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, business_name: businessName }),
      })
      if (!res.ok) throw new Error()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      setProfileError("Failed to save. Please try again.")
    } finally {
      setProfileLoading(false)
    }
  }

  function handleConnect() {
    window.location.href = "/api/google/connect?action=auth"
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch("/api/google/disconnect", { method: "POST" })
      setConnected(false)
    } catch {
      // ignore
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-gf-muted mb-8">Manage your profile and integrations</p>

      <Card className="mb-6">
        <CardTitle>Profile</CardTitle>
        <p className="text-sm text-gf-muted mt-2 mb-4">
          Your name and business details shown to clients.
        </p>
        <form onSubmit={saveProfile} className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sarah Jones"
          />
          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. SJ Nutrition"
          />
          {profileError && <p className="text-sm text-red-400">{profileError}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={profileLoading} size="sm">
              {profileLoading ? "Saving..." : "Save"}
            </Button>
            {profileSaved && (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle size={14} /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle>Google Sheets Connection</CardTitle>
        <p className="text-sm text-gf-muted mt-2 mb-4">
          Connect your Google account so client sheets are created in your
          Drive and meal plans sync automatically.
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connected === null ? (
              <Badge>Checking...</Badge>
            ) : connected ? (
              <>
                <CheckCircle size={16} className="text-green-400" />
                <Badge variant="success">Connected</Badge>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-yellow-400" />
                <Badge variant="warning">Not connected</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {connected && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            )}
            <Button
              variant={connected ? "secondary" : "primary"}
              size="sm"
              onClick={handleConnect}
            >
              <Link2 size={14} className="mr-1.5" />
              {connected ? "Reconnect" : "Connect Google"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
