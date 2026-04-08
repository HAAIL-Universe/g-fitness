export const PLATFORM_BRAND_NAME = "Chameleon Coach"

export interface CoachBranding {
  brand_title: string
  brand_logo_url: string
  brand_primary_color: string
  brand_accent_color: string
  brand_welcome_text: string
  show_powered_by: boolean
}

type BrandingSource = Partial<CoachBranding> | null | undefined

export const DEFAULT_COACH_BRANDING: CoachBranding = {
  brand_title: PLATFORM_BRAND_NAME,
  brand_logo_url: "",
  brand_primary_color: "#ff2d8a",
  brand_accent_color: "#ff6bb3",
  brand_welcome_text: "Let your coach guide the plan while you focus on the work.",
  show_powered_by: true,
}

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function sanitizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value.trim())
    ? value.trim()
    : fallback
}

export function normalizeCoachBranding(source?: BrandingSource): CoachBranding {
  return {
    brand_title: sanitizeText(source?.brand_title) || DEFAULT_COACH_BRANDING.brand_title,
    brand_logo_url: sanitizeText(source?.brand_logo_url),
    brand_primary_color: sanitizeColor(
      source?.brand_primary_color,
      DEFAULT_COACH_BRANDING.brand_primary_color
    ),
    brand_accent_color: sanitizeColor(
      source?.brand_accent_color,
      DEFAULT_COACH_BRANDING.brand_accent_color
    ),
    brand_welcome_text:
      sanitizeText(source?.brand_welcome_text) || DEFAULT_COACH_BRANDING.brand_welcome_text,
    show_powered_by:
      typeof source?.show_powered_by === "boolean"
        ? source.show_powered_by
        : DEFAULT_COACH_BRANDING.show_powered_by,
  }
}
