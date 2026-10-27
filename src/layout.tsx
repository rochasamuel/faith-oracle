import { Link, NavLink, Outlet, useLocation } from "react-router"

import { AccountMenu } from "@/components/shell/account-menu"
import { ChurchSeal } from "@/components/shell/church-seal"
import { useChurchName } from "@/components/shell/use-church-name"
import {
  findSection,
  isPageActive,
  NAV_SECTIONS,
} from "@/components/shell/nav-config"
import { cn } from "@/lib/utils"

/**
 * Casca do livro de registro: capa azul-marinho (trilho no computador, barra
 * superior + abas inferiores no celular) e a folha branca no meio.
 */
export default function Layout() {
  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[17.5rem_1fr]">
      <CoverRail />
      <div className="flex min-w-0 flex-col">
        <MobileTopBar />
        <MobileSectionTabs />
        <main className="flex-1 pb-safe-nav">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}

function CoverRail() {
  const { pathname } = useLocation()
  const churchName = useChurchName()

  return (
    <div className="hidden bg-cover lg:block">
    <aside className="sticky top-0 flex h-svh flex-col text-cover-foreground">
      <Link
        to="/"
        className="flex items-center gap-3 px-5 pt-6 pb-7 outline-none focus-visible:outline-3 focus-visible:outline-cover-muted"
      >
        <ChurchSeal className="size-14" />
        <span className="font-heading text-[1.0625rem] leading-snug font-semibold text-balance">
          {churchName}
        </span>
      </Link>

      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-6">
            <p className="mb-1.5 flex items-center gap-2 px-3 text-sm font-semibold text-cover-muted">
              <section.icon className="size-4.5" aria-hidden />
              {section.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.pages.map((page) => {
                const active = isPageActive(page, pathname)
                return (
                  <li key={page.url}>
                    <Link
                      to={page.url}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-lg px-3 py-2 text-[1.0625rem] transition-colors duration-150 outline-none focus-visible:outline-3 focus-visible:outline-cover-muted",
                        active
                          ? "bg-cover-foreground font-semibold text-cover"
                          : "text-cover-foreground/90 hover:bg-cover-accent hover:text-cover-foreground"
                      )}
                    >
                      {page.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-cover-foreground/12 p-3">
        <AccountMenu variant="rail" side="right" />
      </div>
    </aside>
    </div>
  )
}

function MobileTopBar() {
  const { pathname } = useLocation()
  const section = findSection(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-cover px-4 pt-[env(safe-area-inset-top)] text-cover-foreground lg:hidden">
      <Link to="/" aria-label="Início" className="rounded-full outline-none focus-visible:outline-3 focus-visible:outline-cover-muted">
        <ChurchSeal className="size-10" />
      </Link>
      <span className="min-w-0 flex-1 truncate font-heading text-xl font-semibold">
        {section?.title ?? "Início"}
      </span>
      <AccountMenu variant="compact" side="bottom" />
    </header>
  )
}

/** Páginas da seção atual, como abas roláveis logo abaixo da barra. */
function MobileSectionTabs() {
  const { pathname } = useLocation()
  const section = findSection(pathname)
  if (!section || section.pages.length < 2) return null

  return (
    <nav
      aria-label={`Páginas de ${section.title}`}
      className="sticky top-16 z-20 flex gap-1 overflow-x-auto border-b border-border bg-page px-2 [scrollbar-width:none] lg:hidden"
    >
      {section.pages.map((page) => {
        const active = isPageActive(page, pathname)
        return (
          <Link
            key={page.url}
            to={page.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-12 shrink-0 items-center px-3 text-base whitespace-nowrap transition-colors duration-150",
              active
                ? "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {page.title}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileBottomNav() {
  const { pathname } = useLocation()
  const current = findSection(pathname)

  return (
    <nav
      aria-label="Seções"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-page pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV_SECTIONS.map((section) => {
        const active = current?.id === section.id
        return (
          <NavLink
            key={section.id}
            to={section.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-sm transition-colors duration-150",
              active ? "font-bold text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                active && "bg-accent"
              )}
            >
              <section.icon className="size-6" aria-hidden />
            </span>
            {section.title}
          </NavLink>
        )
      })}
    </nav>
  )
}
