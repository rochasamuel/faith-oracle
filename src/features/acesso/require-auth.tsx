import { Navigate, Outlet } from "react-router"

import { useSession } from "./use-session"

/** Bloqueia as rotas filhas até existir uma sessão do Supabase. */
export function RequireAuth() {
  const { session, loading } = useSession()

  // Bypass no dev server (pnpm dev). `import.meta.env.DEV` é substituído
  // estaticamente no build: em produção este branch vira código morto e é
  // removido do bundle — o bypass não existe no artefato final.
  if (import.meta.env.DEV) return <Outlet />

  if (loading) return null
  if (!session) return <Navigate to="/entrar" replace />

  return <Outlet />
}
