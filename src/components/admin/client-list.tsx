"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardTitle } from "@/components/ui/card"
import { UserPlus, Search } from "lucide-react"
import type { Client } from "@/types"

interface ClientListProps {
  clients: Client[]
}

type SortKey = "name" | "created_at" | "status"

export function ClientList({ clients }: ClientListProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("created_at")

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    if (sortBy === "status") {
      const statusOrder = (c: Client) =>
        c.onboarding_completed ? 0 : c.invite_accepted_at ? 1 : 2
      return statusOrder(a) - statusOrder(b)
    }
    // created_at desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Clients</CardTitle>
        <Link
          href="/admin/invite"
          className="flex items-center gap-1.5 text-sm text-gf-pink hover:text-gf-pink-light transition-colors"
        >
          <UserPlus size={16} />
          Invite
        </Link>
      </div>

      {/* Search and sort controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gf-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-gf-surface border border-gf-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gf-muted/50 focus:outline-none focus:border-gf-pink focus:ring-1 focus:ring-gf-pink/30"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-gf-surface border border-gf-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gf-pink"
        >
          <option value="created_at">Newest</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gf-muted py-4">
          {clients.length === 0 ? (
            <>
              No clients yet.{" "}
              <Link href="/admin/invite" className="text-gf-pink hover:underline">
                Send your first invite
              </Link>
            </>
          ) : (
            "No clients match your search."
          )}
        </p>
      ) : (
        <div className="space-y-1">
          {sorted.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gf-black transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {client.name}
                </p>
                <p className="text-xs text-gf-muted">{client.email}</p>
              </div>
              <div>
                {client.onboarding_completed ? (
                  <Badge variant="success">Active</Badge>
                ) : client.invite_accepted_at ? (
                  <Badge variant="warning">Onboarding</Badge>
                ) : (
                  <Badge>Invited</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
