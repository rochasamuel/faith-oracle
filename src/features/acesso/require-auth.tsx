import { Navigate, Outlet } from "react-router"

import { useSession } from "./use-session"

/** Bloqueia as rotas filhas até existir uma sessão do Supabase. */
export function RequireAuth() {
  const { session, loading } = useSession()

  if (loading) return null
  if (!session) return <Navigate to="/entrar" replace />

  return <Outlet />
}
