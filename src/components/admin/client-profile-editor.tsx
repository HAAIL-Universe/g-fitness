"use client"

import { useState } from "react"
import { Input, TextArea, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ProfileData } from "@/types"

interface ClientProfileEditorProps {
  clientId: string
  sheetId: string
  profile: ProfileData
  onSaved: () => void
  onCancel: () => void
}

export function ClientProfileEditor({
  clientId,
  sheetId,
  profile,
  onSaved,
  onCancel,
}: ClientProfileEditorProps) {
  const [form, setForm] = useState<ProfileData>({ ...profile })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function update(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, profile: form }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Age"
          value={form.age}
          onChange={(e) => update("age", e.target.value)}
        />
        <Select
          label="Gender"
          value={form.gender}
          onChange={(e) => update("gender", e.target.value)}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
        />
        <Input
          label="Height"
          value={form.height}
          onChange={(e) => update("height", e.target.value)}
        />
        <Input
          label="Current Weight"
          value={form.current_weight}
          onChange={(e) => update("current_weight", e.target.value)}
        />
        <Input
          label="Goal Weight"
          value={form.goal_weight}
          onChange={(e) => update("goal_weight", e.target.value)}
        />
        <Select
          label="Activity Level"
          value={form.activity_level}
          onChange={(e) => update("activity_level", e.target.value)}
          options={[
            { value: "sedentary", label: "Sedentary" },
            { value: "lightly_active", label: "Lightly Active" },
            { value: "moderately_active", label: "Moderately Active" },
            { value: "very_active", label: "Very Active" },
          ]}
        />
      </div>

      <TextArea
        label="Fitness Goals"
        value={form.fitness_goals}
        onChange={(e) => update("fitness_goals", e.target.value)}
      />
      <TextArea
        label="Dietary Restrictions"
        value={form.dietary_restrictions}
        onChange={(e) => update("dietary_restrictions", e.target.value)}
      />
      <TextArea
        label="Health Conditions"
        value={form.health_conditions}
        onChange={(e) => update("health_conditions", e.target.value)}
      />
      <TextArea
        label="Notes"
        value={form.notes}
        onChange={(e) => update("notes", e.target.value)}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
