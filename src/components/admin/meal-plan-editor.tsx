"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { MealPlanDay } from "@/types"

interface MealPlanEditorProps {
  clientId: string
  sheetId: string
  mealPlan: MealPlanDay[]
  onSaved: () => void
  onCancel: () => void
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const

export function MealPlanEditor({
  clientId,
  sheetId,
  mealPlan,
  onSaved,
  onCancel,
}: MealPlanEditorProps) {
  const initialPlan = DAYS.map((day) => {
    const existing = mealPlan.find(
      (m) => m.day.toLowerCase() === day.toLowerCase()
    )
    return {
      day,
      breakfast: existing?.breakfast || "",
      lunch: existing?.lunch || "",
      dinner: existing?.dinner || "",
      snacks: existing?.snacks || "",
    }
  })

  const [plan, setPlan] = useState<MealPlanDay[]>(initialPlan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function updateCell(dayIndex: number, meal: typeof MEALS[number], value: string) {
    setPlan((prev) => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], [meal]: value }
      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/meal-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, mealPlan: plan }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save meal plan")
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gf-border">
              <th className="text-left py-2 px-2 text-gf-muted font-medium w-24">Day</th>
              {MEALS.map((meal) => (
                <th key={meal} className="text-left py-2 px-2 text-gf-muted font-medium capitalize">
                  {meal}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.map((day, i) => (
              <tr key={day.day} className="border-b border-gf-border/50">
                <td className="py-2 px-2 text-white font-medium text-xs">
                  {day.day}
                </td>
                {MEALS.map((meal) => (
                  <td key={meal} className="py-1 px-1">
                    <textarea
                      value={day[meal]}
                      onChange={(e) => updateCell(i, meal, e.target.value)}
                      className="w-full bg-gf-surface border border-gf-border rounded px-2 py-1.5 text-xs text-white placeholder:text-gf-muted/50 focus:outline-none focus:border-gf-pink resize-y min-h-[60px]"
                      placeholder={`${meal}...`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Meal Plan"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
