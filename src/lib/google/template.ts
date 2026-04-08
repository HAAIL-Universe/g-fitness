import { google } from "googleapis"
import { getAuthedClient } from "./auth"
import { PLATFORM_NAME } from "@/lib/platform"
import type { OnboardingData } from "@/types"
import {
  COACH_TYPE_LABELS,
  MODULE_LABELS,
  type CoachTypePreset,
  type EnableableModule,
} from "@/lib/modules"

async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string
) {
  const folderSearch = await drive.files.list({
    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
  })

  if (folderSearch.data.files && folderSearch.data.files.length > 0) {
    return folderSearch.data.files[0].id!
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  })

  return folder.data.id!
}

async function moveFileToFolder(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  folderId: string
) {
  const file = await drive.files.get({
    fileId,
    fields: "parents",
  })

  await drive.files.update({
    fileId,
    addParents: folderId,
    removeParents: file.data.parents?.join(",") || "",
    fields: "id, webViewLink",
  })
}

export async function createClientSheet(
  clientName: string,
  onboarding: OnboardingData,
  coachId: string
): Promise<string> {
  const auth = await getAuthedClient(coachId)
  const sheets = google.sheets({ version: "v4", auth })
  const drive = google.drive({ version: "v3", auth })

  // Create the spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `${PLATFORM_NAME} — ${clientName}`,
      },
      sheets: [
        { properties: { title: "Profile", index: 0 } },
        { properties: { title: "Meal Plan", index: 1 } },
        { properties: { title: "Progress", index: 2 } },
      ],
    },
  })

  const sheetId = spreadsheet.data.spreadsheetId!

  // Fill Profile tab with onboarding data
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Profile!A1:B12",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Name", onboarding.name],
        ["Email", ""],
        ["Age", String(onboarding.age)],
        ["Gender", onboarding.gender],
        ["Height", onboarding.height],
        ["Current weight", onboarding.current_weight],
        ["Goal weight", onboarding.goal_weight],
        ["Fitness goals", onboarding.fitness_goals],
        ["Dietary restrictions", onboarding.dietary_restrictions],
        ["Health conditions", onboarding.health_conditions],
        ["Activity level", onboarding.activity_level.replace(/_/g, " ")],
        ["Notes", onboarding.notes],
      ],
    },
  })

  // Set up Meal Plan headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Meal Plan!A1:E8",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Day", "Breakfast", "Lunch", "Dinner", "Snacks"],
        ["Monday", "", "", "", ""],
        ["Tuesday", "", "", "", ""],
        ["Wednesday", "", "", "", ""],
        ["Thursday", "", "", "", ""],
        ["Friday", "", "", "", ""],
        ["Saturday", "", "", "", ""],
        ["Sunday", "", "", "", ""],
      ],
    },
  })

  // Set up Progress headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Progress!A1:D1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Date", "Weight", "Measurements", "Notes"]],
    },
  })

  // Move to a platform folder in coach's Drive, create if it doesn't exist
  const folderId = await ensureDriveFolder(drive, `${PLATFORM_NAME} Clients`)
  await moveFileToFolder(drive, sheetId, folderId)

  return sheetId
}

export async function createCoachWorkspaceSheet({
  coachId,
  coachTypePreset,
  activeModules,
}: {
  coachId: string
  coachTypePreset: CoachTypePreset | null
  activeModules: EnableableModule[]
}) {
  const auth = await getAuthedClient(coachId)
  const sheets = google.sheets({ version: "v4", auth })
  const drive = google.drive({ version: "v3", auth })

  const moduleTitles = activeModules.map((module) => MODULE_LABELS[module])
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `${PLATFORM_NAME} Workspace`,
      },
      sheets: [
        { properties: { title: "Workspace Guide", index: 0 } },
        { properties: { title: "Module Catalog", index: 1 } },
        ...(activeModules.includes("pt_core")
          ? [{ properties: { title: "Exercise Library", index: 2 } }]
          : []),
        ...(activeModules.includes("nutrition_core")
          ? [
              {
                properties: {
                  title: "Recipe Library",
                  index: activeModules.includes("pt_core") ? 3 : 2,
                },
              },
            ]
          : []),
      ],
    },
    fields: "spreadsheetId,spreadsheetUrl",
  })

  const sheetId = spreadsheet.data.spreadsheetId!
  const sheetUrl =
    spreadsheet.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Workspace Guide!A1:B6",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Status", "Provisioned"],
        ["Coach preset", coachTypePreset ? COACH_TYPE_LABELS[coachTypePreset] : "Legacy workspace"],
        ["Active modules", moduleTitles.join(", ") || "Shared core only"],
        ["Connection", "Google is connected and ready for Chameleon-managed sheets"],
        ["Next step", "Use this workspace sheet as the starter managed structure in your Google Drive"],
        ["Source of truth", "Chameleon-managed sheets live in your Google account"],
      ],
    },
  })

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Module Catalog!A1:D${activeModules.length + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Module", "Status", "Scope", "Notes"],
        ["Shared Core", "Enabled", "Coach + client", "Base workspace surfaces"],
        ...activeModules.map((module) => [
          MODULE_LABELS[module],
          "Enabled",
          "Coach",
          module === "pt_core"
            ? "Starter exercise library structure provisioned"
            : "Starter recipe library structure provisioned",
        ]),
      ],
    },
  })

  if (activeModules.includes("pt_core")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Exercise Library!A1:E2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Name", "Category", "Description", "Coaching Notes", "Media URL"],
          ["", "", "", "", ""],
        ],
      },
    })
  }

  if (activeModules.includes("nutrition_core")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Recipe Library!A1:D2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Recipe Name", "Category", "Ingredients", "Notes"],
          ["", "", "", ""],
        ],
      },
    })
  }

  const folderId = await ensureDriveFolder(drive, `${PLATFORM_NAME} Workspace`)
  await moveFileToFolder(drive, sheetId, folderId)

  return {
    sheetId,
    sheetUrl,
  }
}
