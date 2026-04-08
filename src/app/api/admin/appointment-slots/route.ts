import { NextResponse, type NextRequest } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"

export async function GET() {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user, supabase } = result

  const { data: slots } = await supabase
    .from("appointment_slots")
    .select("*")
    .eq("coach_id", user.id)
    .is("appointment_id", null)
    .order("starts_at", { ascending: true })

  return NextResponse.json({ slots: slots ?? [] })
}

export async function POST(request: NextRequest) {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user, supabase } = result

  const { starts_at, duration_minutes, is_visible, slots } = await request.json()
  const normalizedSlots = Array.isArray(slots) && slots.length > 0
    ? slots
    : starts_at
      ? [{ starts_at, duration_minutes, is_visible }]
      : []

  if (normalizedSlots.length === 0) {
    return NextResponse.json({ error: "starts_at is required" }, { status: 400 })
  }

  const payload = normalizedSlots
    .filter((slot) => slot?.starts_at)
    .map((slot) => ({
      coach_id: user.id,
      starts_at: slot.starts_at,
      duration_minutes:
        typeof slot.duration_minutes === "number" && slot.duration_minutes > 0
          ? slot.duration_minutes
          : 60,
      is_visible: Boolean(slot.is_visible),
    }))

  if (payload.length === 0) {
    return NextResponse.json({ error: "starts_at is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("appointment_slots")
    .insert(payload)
    .select("*")

  if (error) {
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
  }

  return NextResponse.json({ slots: data ?? [] })
}
