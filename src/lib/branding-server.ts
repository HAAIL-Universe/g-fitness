import { createAdmin } from "@/lib/supabase/server"
import { normalizeCoachBranding } from "@/lib/branding"

const BRANDING_SELECT =
  "brand_title, brand_logo_url, brand_primary_color, brand_accent_color, brand_welcome_text, show_powered_by"

export async function getCoachBrandingByCoachId(coachId: string | null | undefined) {
  if (!coachId) {
    return normalizeCoachBranding()
  }

  const admin = createAdmin()
  const { data } = await admin
    .from("admin_settings")
    .select(BRANDING_SELECT)
    .eq("user_id", coachId)
    .maybeSingle()

  return normalizeCoachBranding(data)
}

export async function getCoachBrandingForClientUser(userId: string) {
  const admin = createAdmin()
  const { data: client } = await admin
    .from("clients")
    .select("coach_id")
    .eq("user_id", userId)
    .maybeSingle()

  return getCoachBrandingByCoachId(client?.coach_id)
}
