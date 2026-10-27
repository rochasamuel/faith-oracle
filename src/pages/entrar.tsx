import { useState } from "react"
import { Navigate } from "react-router"

import { EyeIcon, EyeOffIcon } from "lucide-react"

import { ChurchSeal } from "@/components/shell/church-seal"
import { useChurchName } from "@/components/shell/use-church-name"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/features/acesso/use-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EntrarPage() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const churchName = useChurchName()

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function handleSubmit() {
    setSigningIn(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setError("E-mail ou senha não conferem. Confira e tente de novo.")
      setSigningIn(false)
    }
    // Com sucesso, onAuthStateChange atualiza a sessão e o <Navigate> acima redireciona.
  }

  return (
    <div className="flex min-h-svh flex-col bg-cover text-cover-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      {/* Capa do livro */}
      <div className="flex flex-col items-center justify-center gap-5 px-6 pt-12 pb-10 text-center lg:items-start lg:px-16 lg:text-left">
        <ChurchSeal className="size-28 lg:size-40" />
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="font-heading text-[1.75rem] leading-tight font-semibold text-balance lg:text-[2.75rem]">
            {churchName}
          </h1>
          <p className="text-lg text-cover-muted">
            Secretaria, tesouraria e Escola Bíblica Dominical.
          </p>
        </div>
      </div>

      {/* Folha */}
      <div className="folha flex flex-1 flex-col justify-center rounded-t-3xl px-7 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-foreground sm:px-12 lg:rounded-none lg:px-16">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          className="mx-auto flex w-full max-w-sm flex-col gap-5"
        >
          <div className="flex flex-col gap-1 border-b-2 border-foreground/80 pb-4">
            <h2 className="font-heading text-[2rem] leading-tight font-semibold">Entrar</h2>
            <p className="text-base text-muted-foreground">
              Use o e-mail e a senha que a igreja cadastrou para você.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1 right-1"
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-base font-semibold text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={signingIn}>
            {signingIn ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Esqueceu a senha? Fale com o secretário ou o pastor da igreja.
          </p>
        </form>
      </div>
    </div>
  )
}
