"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MealPlanView } from "@/components/meal-plan/meal-plan-view"
import { ProgressChart, ProgressHistory } from "@/components/progress/progress-chart"
import { ClientProfileEditor } from "./client-profile-editor"
import { MealPlanEditor } from "./meal-plan-editor"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react"
import type { Client, ProfileData, MealPlanDay, ProgressEntry } from "@/types"

interface ClientDetailViewProps {
  client: Client
  profile: ProfileData | null
  mealPlan: MealPlanDay[]
  progress: ProgressEntry[]
}

export function ClientDetailView({
  client,
  profile,
  mealPlan,
  progress,
}: ClientDetailViewProps) {
  const router = useRouter()
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingMealPlan, setEditingMealPlan] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sheetUrl = client.sheet_id
    ? `https://docs.google.com/spreadsheets/d/${client.sheet_id}`
    : null

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove this client? This cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/admin")
      }
    } catch {
      setDeleting(false)
    }
  }

  function handleSaved() {
    setEditingProfile(false)
    setEditingMealPlan(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-sm text-gf-muted hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to clients
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-gf-muted">{client.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {client.onboarding_completed ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="warning">Pending</Badge>
          )}
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gf-pink hover:text-gf-pink-light transition-colors"
            >
              <ExternalLink size={14} />
              Open Sheet
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile data */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Profile</CardTitle>
            {profile && !editingProfile && client.sheet_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingProfile(true)}
              >
                <Pencil size={14} className="mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          {editingProfile && profile && client.sheet_id ? (
            <ClientProfileEditor
              clientId={client.id}
              sheetId={client.sheet_id}
              profile={profile}
              onSaved={handleSaved}
              onCancel={() => setEditingProfile(false)}
            />
          ) : profile ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Age", value: profile.age },
                  { label: "Gender", value: profile.gender },
                  { label: "Height", value: profile.height },
                  { label: "Current Weight", value: profile.current_weight },
                  { label: "Goal Weight", value: profile.goal_weight },
                  { label: "Activity Level", value: profile.activity_level },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div key={label}>
                        <p className="text-xs text-gf-muted">{label}</p>
                        <p className="text-sm text-white mt-0.5">{value}</p>
                      </div>
                    )
                )}
              </div>
              {profile.fitness_goals && (
                <div className="mt-4 pt-4 border-t border-gf-border">
                  <p className="text-xs text-gf-muted">Fitness Goals</p>
                  <p className="text-sm text-white mt-0.5">{profile.fitness_goals}</p>
                </div>
              )}
              {profile.dietary_restrictions && (
                <div className="mt-3">
                  <p className="text-xs text-gf-muted">Dietary Restrictions</p>
                  <p className="text-sm text-white mt-0.5">{profile.dietary_restrictions}</p>
                </div>
              )}
              {profile.health_conditions && (
                <div className="mt-3">
                  <p className="text-xs text-gf-muted">Health Conditions</p>
                  <p className="text-sm text-white mt-0.5">{profile.health_conditions}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gf-muted">No profile data available.</p>
          )}
        </Card>

        {/* Meal plan */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Meal Plan</CardTitle>
            {!editingMealPlan && client.sheet_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingMealPlan(true)}
              >
                <Pencil size={14} className="mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          {editingMealPlan && client.sheet_id ? (
            <MealPlanEditor
              clientId={client.id}
              sheetId={client.sheet_id}
              mealPlan={mealPlan}
              onSaved={handleSaved}
              onCancel={() => setEditingMealPlan(false)}
            />
          ) : (
            <MealPlanView mealPlan={mealPlan} />
          )}
        </Card>

        {/* Progress */}
        {progress.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Progress</h2>
            <div className="grid gap-6">
              <ProgressChart entries={progress} />
              <ProgressHistory entries={progress} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
