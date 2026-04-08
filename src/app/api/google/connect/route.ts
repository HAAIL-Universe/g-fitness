import { NextResponse, type NextRequest } from "next/server"
import { verifyCoach, isCoachResult } from "@/lib/auth-helpers"
import { createAdmin } from "@/lib/supabase/server"
import { getAuthUrl } from "@/lib/google/auth"
import { normalizeActiveModules, resolveActiveModules } from "@/lib/modules"

export async function GET(request: NextRequest) {
  const result = await verifyCoach()
  if (!isCoachResult(result)) return result
  const { user } = result

  const action = request.nextUrl.searchParams.get("action")

  if (action === "auth") {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  }

  const admin = createAdmin()
  const { data: settings } = await admin
    .from("admin_settings")
    .select("google_refresh_token, coach_type_preset, active_modules, managed_workspace_sheet_id, managed_workspace_sheet_url, managed_workspace_sheet_modules, managed_workspace_sheet_provisioned_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const modules = resolveActiveModules(settings ?? {})
  const currentModules = modules.enableable_modules
  const provisionedModules = normalizeActiveModules(
    settings?.managed_workspace_sheet_modules
  )
  const provisionedForCurrentModules =
    !!settings?.managed_workspace_sheet_id
    && !!settings?.managed_workspace_sheet_provisioned_at
    && provisionedModules.length === currentModules.length
    && currentModules.every((module) => provisionedModules.includes(module))

  return NextResponse.json({
    connected: !!settings?.google_refresh_token,
    sheets_provisioned: provisionedForCurrentModules,
    managed_workspace_sheet_id: settings?.managed_workspace_sheet_id ?? null,
    managed_workspace_sheet_url: settings?.managed_workspace_sheet_url ?? null,
    active_modules: currentModules,
  })
}
