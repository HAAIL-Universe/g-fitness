function isMissingCoachIdColumn(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false
  }

  return error.code === "42703" || error.message?.includes("column clients.coach_id does not exist") === true
}

export async function listClientsForCoach(
  supabase: { from: (table: string) => any },
  coachId: string
) {
  const scopedQuery = await supabase
    .from("clients")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })

  if (!isMissingCoachIdColumn(scopedQuery.error)) {
    return scopedQuery
  }

  // Legacy single-workspace fallback before the coach_id migration exists live.
  return supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })
}

export async function findAnyClientsForCoach(
  supabase: { from: (table: string) => any },
  coachId: string
) {
  const scopedQuery = await supabase
    .from("clients")
    .select("id")
    .eq("coach_id", coachId)
    .limit(1)
    .maybeSingle()

  if (!isMissingCoachIdColumn(scopedQuery.error)) {
    return scopedQuery
  }

  return supabase
    .from("clients")
    .select("id")
    .limit(1)
    .maybeSingle()
}

export async function deleteClientsForCoach(
  supabase: { from: (table: string) => any },
  coachId: string
) {
  const scopedDelete = await supabase
    .from("clients")
    .delete()
    .eq("coach_id", coachId)

  if (!isMissingCoachIdColumn(scopedDelete.error)) {
    return scopedDelete
  }

  // Legacy single-workspace fallback before the coach_id migration exists live.
  const legacyClientsQuery = await supabase
    .from("clients")
    .select("id")

  if (legacyClientsQuery.error) {
    return { data: null, error: legacyClientsQuery.error }
  }

  const legacyClientIds = (legacyClientsQuery.data ?? [])
    .map((client: { id: string | null }) => client.id)
    .filter((id: string | null): id is string => typeof id === "string" && id.length > 0)

  if (legacyClientIds.length === 0) {
    return { data: [], error: null }
  }

  return supabase
    .from("clients")
    .delete()
    .in("id", legacyClientIds)
}
