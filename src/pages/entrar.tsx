import { useState } from "react"
import { Navigate } from "react-router"
import { ChurchIcon } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useSession } from "@/features/acesso/use-session"
import { CHURCH_INFO } from "@/config/church"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function EntrarPage() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSigningIn(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setError("E-mail ou senha incorretos.")
      setSigningIn(false)
    }
    // Com sucesso, onAuthStateChange atualiza a sessão e o <Navigate> acima redireciona.
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChurchIcon className="size-6" />
          </div>
          <CardTitle className="font-heading">{CHURCH_INFO.nome}</CardTitle>
          <CardDescription>
            Entre com sua conta para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={signingIn}>
              {signingIn ? "Entrando..." : "Entrar"}
            </Button>
            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
