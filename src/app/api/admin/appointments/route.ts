import { NextResponse, type NextRequest } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"
import { createAppointmentCalendarEvent } from "@/lib/google/calendar"
import { sendAppointmentConfirmedEmail } from "@/lib/resend"

export async function GET() {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user, supabase } = result

  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (
        id,
        name,
        email
      )
    `)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ appointments: appointments ?? [] })
}

export async function POST(request: NextRequest) {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user, supabase } = result

  const { client_id, starts_at, duration_minutes, note, direct_confirm } = await request.json()

  if (!client_id || !starts_at) {
    return NextResponse.json({ error: "client_id and starts_at are required" }, { status: 400 })
  }

  const normalizedDuration =
    typeof duration_minutes === "number" && duration_minutes > 0 ? duration_minutes : 60
  const status = direct_confirm ? "confirmed" : "pending"
  const insertPayload = {
    coach_id: user.id,
    client_id,
    confirmed_at: starts_at,
    duration_minutes: normalizedDuration,
    requested_note: direct_confirm ? null : note || null,
    coach_note: direct_confirm ? note || null : null,
    status,
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert(insertPayload)
    .select(`
      *,
      clients (
        name,
        email
      )
    `)
    .single()

  if (error || !appointment) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }

  if (status === "confirmed") {
    if (!appointment.clients?.email) {
      await supabase.from("appointments").delete().eq("id", appointment.id)
      return NextResponse.json(
        { error: "Client email is required for Calendar sync" },
        { status: 400 }
      )
    }

    try {
      const calendarEvent = await createAppointmentCalendarEvent({
        coachId: user.id,
        clientName: appointment.clients.name || "Client",
        clientEmail: appointment.clients.email,
        confirmedAt: starts_at,
        durationMinutes: normalizedDuration,
        coachNote: note || null,
        requestedNote: null,
      })

      await supabase
        .from("appointments")
        .update({
          google_calendar_event_id: calendarEvent.id,
          google_calendar_event_link: calendarEvent.htmlLink,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id)
    } catch (calendarError) {
      await supabase.from("appointments").delete().eq("id", appointment.id)
      return NextResponse.json(
        {
          error:
            calendarError instanceof Error
              ? `Google Calendar sync failed: ${calendarError.message}`
              : "Google Calendar sync failed",
        },
        { status: 400 }
      )
    }

    try {
      await sendAppointmentConfirmedEmail(
        appointment.clients.email,
        appointment.clients.name || "there",
        starts_at,
        note || ""
      )
    } catch {
      // Email failure is non-fatal
    }
  }

  return NextResponse.json({ ok: true, appointment })
}
