import { useSession } from "@/features/acesso/use-session"

/** Nome e e-mail de quem está usando, a partir da sessão. */
export function useCurrentUser() {
  const { session } = useSession()
  const authUser = session?.user
  return {
    name:
      (authUser?.user_metadata?.full_name as string | undefined) ??
      authUser?.email?.split("@")[0] ??
      "Usuário",
    email: authUser?.email ?? "",
  }
}
