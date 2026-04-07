import { NextResponse, type NextRequest } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"
import { createAdmin } from "@/lib/supabase/server"

export async function GET() {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const admin = createAdmin()
  const { data } = await admin
    .from("admin_settings")
    .select("display_name, business_name")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({
    display_name: data?.display_name ?? "",
    business_name: data?.business_name ?? "",
  })
}

export async function PATCH(request: NextRequest) {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const { display_name, business_name } = await request.json()

  const admin = createAdmin()
  const { error } = await admin
    .from("admin_settings")
    .upsert(
      {
        user_id: user.id,
        display_name: display_name ?? null,
        business_name: business_name ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
