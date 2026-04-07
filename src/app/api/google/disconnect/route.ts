import { NextResponse } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"
import { createAdmin } from "@/lib/supabase/server"

export async function POST() {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const admin = createAdmin()
  const { error } = await admin
    .from("admin_settings")
    .update({
      google_refresh_token: null,
      google_access_token: null,
      google_token_expiry: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
