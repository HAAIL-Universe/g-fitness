"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Appointment = {
  id: string
  status: "pending" | "confirmed" | "declined" | "cancelled"
  requested_note: string | null
  confirmed_at: string | null
  coach_note: string | null
  created_at: string
  clients: { id: string; name: string | null; email: string } | null
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function statusBadge(status: Appointment["status"]) {
  switch (status) {
    case "pending": return <Badge variant="warning">Pending</Badge>
    case "confirmed": return <Badge variant="success">Confirmed</Badge>
    case "declined": return <Badge variant="default">Declined</Badge>
    case "cancelled": return <Badge variant="default">Cancelled</Badge>
  }
}

function appointmentDate(appointment: Appointment) {
  return new Date(appointment.confirmed_at || appointment.created_at)
}

function formatDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatCalendarTime(appointment: Appointment) {
  if (appointment.status !== "confirmed" || !appointment.confirmed_at) {
    return appointment.status === "pending" ? "Request" : "Update"
  }

  return new Date(appointment.confirmed_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function eventClasses(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return "border-green-500/30 bg-green-500/10 text-green-200"
    case "pending":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
    case "declined":
      return "border-gf-border bg-gf-surface text-gf-muted"
    case "cancelled":
      return "border-gf-border bg-gf-surface text-gf-muted"
  }
}

function ConfirmForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirmedAt, setConfirmedAt] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!confirmedAt) return
    setLoading(true)
    await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed", confirmed_at: confirmedAt, coach_note: note }),
    })
    onDone()
  }

  return (
    <div className="mt-3 space-y-2 border-t border-gf-border pt-3">
      <input
        type="datetime-local"
        value={confirmedAt}
        onChange={(e) => setConfirmedAt(e.target.value)}
        className="w-full bg-gf-surface border border-gf-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gf-pink"
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note to client (optional)"
        className="w-full bg-gf-surface border border-gf-border rounded-lg px-3 py-2 text-sm text-white placeholder-gf-muted focus:outline-none focus:border-gf-pink"
      />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading || !confirmedAt} className="text-sm py-1.5 px-4">
          {loading ? "Confirming..." : "Confirm"}
        </Button>
        <button onClick={onDone} className="text-sm text-gf-muted hover:text-white px-4">
          Cancel
        </button>
      </div>
    </div>
  )
}

function DeclineForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined", coach_note: note }),
    })
    onDone()
  }

  return (
    <div className="mt-3 space-y-2 border-t border-gf-border pt-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason for declining (optional, sent to client)"
        rows={2}
        className="w-full bg-gf-surface border border-gf-border rounded-lg px-3 py-2 text-sm text-white placeholder-gf-muted focus:outline-none focus:border-gf-pink resize-none"
      />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading} variant="secondary" className="text-sm py-1.5 px-4">
          {loading ? "Declining..." : "Decline"}
        </Button>
        <button onClick={onDone} className="text-sm text-gf-muted hover:text-white px-4">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  async function load() {
    const data = await fetch("/api/admin/appointments").then((r) => r.json())
    setAppointments(data.appointments ?? [])
    setConfirming(null)
    setDeclining(null)
  }

  useEffect(() => { load() }, [])

  const pending = appointments.filter((a) => a.status === "pending")
  const confirmed = appointments.filter((a) => a.status === "confirmed")
  const past = appointments.filter((a) => a.status === "declined" || a.status === "cancelled")
  const appointmentMap = appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const key = formatDayKey(appointmentDate(appointment))
    if (!acc[key]) acc[key] = []
    acc[key].push(appointment)
    acc[key].sort((a, b) => appointmentDate(a).getTime() - appointmentDate(b).getTime())
    return acc
  }, {})

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
  const startOffset = (monthStart.getDay() + 6) % 7
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(monthStart.getDate() - startOffset)
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    return date
  })
  const todayKey = formatDayKey(new Date())

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      <section className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold">Calendar</h2>
            <p className="text-sm text-gf-muted">
              Confirmed sessions use their scheduled time. Pending and declined requests stay visible on the day they were created.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                )
              }
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                )
              }
            >
              Next
            </Button>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="font-medium">
              {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-200">
                Confirmed
              </span>
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-yellow-100">
                Pending
              </span>
              <span className="rounded-full border border-gf-border bg-gf-surface px-2 py-1 text-gf-muted">
                Declined / Cancelled
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-gf-muted">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date) => {
              const dayKey = formatDayKey(date)
              const items = appointmentMap[dayKey] ?? []
              const isCurrentMonth = date >= monthStart && date <= monthEnd
              const isToday = dayKey === todayKey

              return (
                <div
                  key={dayKey}
                  className={[
                    "min-h-32 rounded-xl border p-2",
                    isCurrentMonth ? "border-gf-border bg-gf-card" : "border-gf-border/50 bg-gf-surface/40 text-gf-muted",
                    isToday ? "ring-1 ring-gf-pink" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{date.getDate()}</span>
                    {items.length > 0 && (
                      <span className="text-[11px] text-gf-muted">{items.length} item{items.length === 1 ? "" : "s"}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {items.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`rounded-lg border px-2 py-1 text-xs ${eventClasses(appointment.status)}`}
                      >
                        <p className="font-medium truncate">
                          {appointment.clients?.name ?? "Unknown client"}
                        </p>
                        <p className="truncate">
                          {formatCalendarTime(appointment)}
                          {appointment.status !== "confirmed" ? ` • ${appointment.status}` : ""}
                        </p>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-gf-muted">+{items.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{a.clients?.name ?? "Unknown client"}</p>
                    <p className="text-xs text-gf-muted">{a.clients?.email}</p>
                    {a.requested_note && (
                      <p className="text-sm text-gf-muted mt-1">"{a.requested_note}"</p>
                    )}
                    <p className="text-xs text-gf-muted">
                      {new Date(a.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  {statusBadge(a.status)}
                </div>
                {confirming === a.id ? (
                  <ConfirmForm id={a.id} onDone={load} />
                ) : declining === a.id ? (
                  <DeclineForm id={a.id} onDone={load} />
                ) : (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gf-border">
                    <Button
                      onClick={() => { setConfirming(a.id); setDeclining(null) }}
                      className="text-sm py-1.5 px-4"
                    >
                      Confirm
                    </Button>
                    <button
                      onClick={() => { setDeclining(a.id); setConfirming(null) }}
                      className="text-sm text-gf-muted hover:text-white px-4"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {confirmed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Confirmed Sessions</h2>
          <div className="space-y-3">
            {confirmed.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{a.clients?.name ?? "Unknown client"}</p>
                    {a.confirmed_at && (
                      <p className="text-sm">
                        {new Date(a.confirmed_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
                      </p>
                    )}
                    {a.coach_note && (
                      <p className="text-sm text-gf-muted">"{a.coach_note}"</p>
                    )}
                  </div>
                  {statusBadge(a.status)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gf-muted">Past</h2>
          <div className="space-y-3">
            {past.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm">{a.clients?.name ?? "Unknown client"}</p>
                    <p className="text-xs text-gf-muted">{new Date(a.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  {statusBadge(a.status)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {appointments.length === 0 && (
        <p className="text-gf-muted text-sm">No appointments yet.</p>
      )}
    </div>
  )
}
