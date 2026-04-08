import { NextResponse, type NextRequest } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"
import { createAdmin } from "@/lib/supabase/server"
import { normalizeCoachBranding } from "@/lib/branding"
import { normalizeActiveModules, normalizeCoachTypePreset, resolveActiveModules } from "@/lib/modules"

export async function GET() {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const admin = createAdmin()
  const { data } = await admin
    .from("admin_settings")
    .select("display_name, business_name, brand_title, brand_logo_url, brand_primary_color, brand_accent_color, brand_welcome_text, show_powered_by, coach_type_preset, active_modules, appointment_booking_mode")
    .eq("user_id", user.id)
    .maybeSingle()

  const branding = normalizeCoachBranding(data)
  const modules = resolveActiveModules(data ?? {})

  return NextResponse.json({
    display_name: data?.display_name ?? "",
    business_name: data?.business_name ?? "",
    coach_type_preset: modules.coach_type_preset,
    active_modules: modules.enableable_modules,
    resolved_active_modules: modules.active_modules,
    is_legacy_workspace: modules.is_legacy_workspace,
    appointment_booking_mode: data?.appointment_booking_mode ?? "coach_only",
    ...branding,
  })
}

export async function PATCH(request: NextRequest) {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const {
    display_name,
    business_name,
    brand_title,
    brand_logo_url,
    brand_primary_color,
    brand_accent_color,
    brand_welcome_text,
    show_powered_by,
    coach_type_preset,
    active_modules,
    appointment_booking_mode,
  } = await request.json()

  const branding = normalizeCoachBranding({
    brand_title,
    brand_logo_url,
    brand_primary_color,
    brand_accent_color,
    brand_welcome_text,
    show_powered_by,
  })
  const preset = normalizeCoachTypePreset(coach_type_preset)
  const modules = normalizeActiveModules(active_modules)

  const admin = createAdmin()
  const { error } = await admin
    .from("admin_settings")
    .upsert(
      {
        user_id: user.id,
        display_name: display_name ?? null,
        business_name: business_name ?? null,
        brand_title: branding.brand_title,
        brand_logo_url: branding.brand_logo_url || null,
        brand_primary_color: branding.brand_primary_color,
        brand_accent_color: branding.brand_accent_color,
        brand_welcome_text: branding.brand_welcome_text,
        show_powered_by: branding.show_powered_by,
        coach_type_preset: preset,
        active_modules: modules,
        appointment_booking_mode:
          appointment_booking_mode === "client_request_visible_slots"
            ? "client_request_visible_slots"
            : "coach_only",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
