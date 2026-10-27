import { CheckIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/components/shell/use-current-user"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "Tema claro", icon: SunIcon },
  { value: "dark", label: "Tema escuro", icon: MoonIcon },
  { value: "system", label: "Igual ao aparelho", icon: MonitorIcon },
] as const

function initials(name: string) {
  const parts = name.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * Menu da conta: quem está usando, tema e sair.
 * `variant="rail"` mostra nome e e-mail (trilho do computador);
 * `variant="compact"` mostra só as iniciais (barra do celular).
 */
export function AccountMenu({
  variant,
  side = "top",
}: {
  variant: "rail" | "compact"
  side?: "top" | "bottom" | "right"
}) {
  const user = useCurrentUser()
  const { theme = "system", setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Conta e preferências"
        className={cn(
          "flex items-center gap-3 rounded-lg text-left text-cover-foreground transition-colors duration-150 outline-none hover:bg-cover-accent focus-visible:outline-3 focus-visible:outline-cover-muted aria-expanded:bg-cover-accent",
          variant === "rail" ? "w-full p-2.5" : "size-12 justify-center"
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cover-foreground/12 text-sm font-bold tracking-wide ring-1 ring-cover-foreground/25">
          {initials(user.name)}
        </span>
        {variant === "rail" && (
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-sm text-cover-muted">{user.email}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-base font-semibold text-foreground">
              {user.name}
            </span>
            <span className="block truncate">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
              <Icon />
              {label}
              {theme === value && <CheckIcon className="ml-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
          <LogOutIcon />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
