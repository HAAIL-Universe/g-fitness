export const COACH_TYPE_PRESETS = [
  "personal_trainer",
  "nutritionist",
  "wellness_coach",
  "sports_performance_coach",
  "yoga_pilates_instructor",
  "gym_studio_owner",
] as const

export type CoachTypePreset = (typeof COACH_TYPE_PRESETS)[number]

export const ENABLEABLE_MODULES = ["pt_core", "nutrition_core"] as const

export type EnableableModule = (typeof ENABLEABLE_MODULES)[number]
export type ModuleKey = "shared_core" | EnableableModule

export const MODULE_LABELS: Record<EnableableModule, string> = {
  pt_core: "PT Core",
  nutrition_core: "Nutrition Core",
}

export function isCoachTypePreset(value: unknown): value is CoachTypePreset {
  return typeof value === "string" && COACH_TYPE_PRESETS.includes(value as CoachTypePreset)
}

export function normalizeCoachTypePreset(value: unknown): CoachTypePreset | null {
  return isCoachTypePreset(value) ? value : null
}

export function normalizeActiveModules(value: unknown): EnableableModule[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (entry, index, array): entry is EnableableModule =>
      typeof entry === "string"
      && ENABLEABLE_MODULES.includes(entry as EnableableModule)
      && array.indexOf(entry) === index
  )
}

export function seedModulesForPreset(preset: CoachTypePreset): EnableableModule[] {
  switch (preset) {
    case "personal_trainer":
      return ["pt_core"]
    case "nutritionist":
      return ["nutrition_core"]
    default:
      return []
  }
}

export function resolveActiveModules(input: {
  active_modules?: unknown
  coach_type_preset?: unknown
}) {
  const preset = normalizeCoachTypePreset(input.coach_type_preset)
  const storedModules = normalizeActiveModules(input.active_modules)
  const isLegacyWorkspace = input.active_modules == null
  const enableableModules: EnableableModule[] = isLegacyWorkspace ? ["pt_core"] : storedModules
  const activeModules: ModuleKey[] = ["shared_core", ...enableableModules]

  return {
    coach_type_preset: preset,
    stored_modules: storedModules,
    active_modules: activeModules,
    enableable_modules: enableableModules,
    is_legacy_workspace: isLegacyWorkspace,
    has_module: (module: ModuleKey) => activeModules.includes(module),
  }
}
