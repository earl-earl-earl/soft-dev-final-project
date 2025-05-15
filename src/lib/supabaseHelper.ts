import { supabase } from "./supabaseClient"

export async function getUserWithRole() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user?.id) return null

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (error || !data) return null

  return { role: data.role, id: session.user.id }
}
