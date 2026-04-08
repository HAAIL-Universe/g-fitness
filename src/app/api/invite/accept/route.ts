import { NextResponse, type NextRequest } from "next/server"
import { createAdmin } from "@/lib/supabase/server"
import { createClientSheet } from "@/lib/google/template"
import type { OnboardingData } from "@/types"
import { getCoachBrandingByCoachId } from "@/lib/branding-server"
import { normalizeCoachTypePreset, resolveActiveModules } from "@/lib/modules"

// GET: validate token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ valid: false, reason: "missing" })
  }

  const supabase = createAdmin()
  const { data: client } = await supabase
    .from("clients")
    .select("email, invite_expires_at, onboarding_completed, coach_id")
    .eq("invite_token", token)
    .single()

  if (!client) {
    return NextResponse.json({ valid: false, reason: "invalid" })
  }

  const branding = await getCoachBrandingByCoachId(client.coach_id)

  if (client.onboarding_completed) {
    return NextResponse.json({ valid: false, reason: "already_used", branding })
  }

  if (
    client.invite_expires_at &&
    new Date(client.invite_expires_at) < new Date()
  ) {
    return NextResponse.json({ valid: false, reason: "expired", branding })
  }

  return NextResponse.json({ valid: true, email: client.email, branding })
}

// POST: complete onboarding
export async function POST(request: NextRequest) {
  const { token, password, onboarding } = (await request.json()) as {
    token: string
    password: string
    onboarding: OnboardingData
  }

  if (!token || !password || !onboarding) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    )
  }

  const supabase = createAdmin()

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("*, coach_id")
    .eq("invite_token", token)
    .single()

  if (!client) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 })
  }

  if (client.onboarding_completed) {
    return NextResponse.json(
      { error: "Already onboarded" },
      { status: 400 }
    )
  }

  if (
    client.invite_expires_at &&
    new Date(client.invite_expires_at) < new Date()
  ) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 })
  }

  // Create Supabase auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: client.email,
      password,
      email_confirm: true,
    })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || "Failed to create account" },
      { status: 500 }
    )
  }

  const { data: settings } = client.coach_id
    ? await supabase
        .from("admin_settings")
        .select("coach_type_preset, active_modules, managed_workspace_sheet_id, managed_workspace_sheet_url, managed_workspace_root_folder_id, managed_workspace_root_folder_url, managed_clients_folder_id, managed_clients_folder_url, managed_pt_library_sheet_id, managed_pt_library_sheet_url, managed_nutrition_library_sheet_id, managed_nutrition_library_sheet_url")
        .eq("user_id", client.coach_id)
        .maybeSingle()
    : { data: null }

  const modules = resolveActiveModules(settings ?? {})

  // Create client workspace in the coach-owned Google Drive hierarchy.
  let sheetId: string | null = null
  let driveFolderId: string | null = null
  let driveFolderUrl: string | null = null
  let sheetSharedEmail: string | null = null
  let sheetSharedPermissionId: string | null = null
  let sheetSharedAt: string | null = null
  try {
    if (client.coach_id) {
      const clientWorkspace = await createClientSheet({
        clientId: client.id,
        clientName: onboarding.name,
        clientEmail: client.email,
        onboarding,
        coachId: client.coach_id,
        coachTypePreset: normalizeCoachTypePreset(settings?.coach_type_preset),
        activeModules: modules.enableable_modules,
        coachWorkspace: settings,
        clientWorkspace: client,
        shareWithClient: true,
      })

      sheetId = clientWorkspace.sheetId
      driveFolderId = clientWorkspace.driveFolderId
      driveFolderUrl = clientWorkspace.driveFolderUrl
      sheetSharedEmail = clientWorkspace.sheet_shared_email ?? null
      sheetSharedPermissionId = clientWorkspace.sheet_shared_permission_id ?? null
      sheetSharedAt = clientWorkspace.sheet_shared_at ?? null

      await supabase
        .from("admin_settings")
        .upsert(
          {
            user_id: client.coach_id,
            managed_workspace_sheet_id: clientWorkspace.coachWorkspace.managed_workspace_sheet_id ?? null,
            managed_workspace_sheet_url: clientWorkspace.coachWorkspace.managed_workspace_sheet_url ?? null,
            managed_workspace_root_folder_id:
              clientWorkspace.coachWorkspace.managed_workspace_root_folder_id ?? null,
            managed_workspace_root_folder_url:
              clientWorkspace.coachWorkspace.managed_workspace_root_folder_url ?? null,
            managed_clients_folder_id: clientWorkspace.coachWorkspace.managed_clients_folder_id ?? null,
            managed_clients_folder_url:
              clientWorkspace.coachWorkspace.managed_clients_folder_url ?? null,
            managed_pt_library_sheet_id:
              clientWorkspace.coachWorkspace.managed_pt_library_sheet_id ?? null,
            managed_pt_library_sheet_url:
              clientWorkspace.coachWorkspace.managed_pt_library_sheet_url ?? null,
            managed_nutrition_library_sheet_id:
              clientWorkspace.coachWorkspace.managed_nutrition_library_sheet_id ?? null,
            managed_nutrition_library_sheet_url:
              clientWorkspace.coachWorkspace.managed_nutrition_library_sheet_url ?? null,
            managed_workspace_sheet_modules: modules.enableable_modules,
            managed_workspace_sheet_provisioned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
    }
  } catch {
    // Google might not be connected yet — continue without sheet
  }

  // Update client record
  await supabase
    .from("clients")
    .update({
      user_id: authData.user.id,
      name: onboarding.name,
      sheet_id: sheetId,
      drive_folder_id: driveFolderId,
      drive_folder_url: driveFolderUrl,
      sheet_shared_email: sheetSharedEmail,
      sheet_shared_permission_id: sheetSharedPermissionId,
      sheet_shared_at: sheetSharedAt,
      invite_accepted_at: new Date().toISOString(),
      onboarding_completed: true,
      invite_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", client.id)

  return NextResponse.json({ ok: true })
}
