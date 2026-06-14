import * as React from "react"
import { Link, matchPath, useLocation } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Crumb {
  label: string
  /** Quando presente, vira link; o último item nunca tem `to`. */
  to?: string
}

/**
 * Mapeia cada rota para a trilha de breadcrumbs (seção › página). Espelha a
 * navegação da AppSidebar. A ordem importa: o primeiro `pattern` que casar vence,
 * então rotas mais específicas vêm antes das genéricas.
 */
const ROUTES: { pattern: string; crumbs: Crumb[] }[] = [
  { pattern: "/financeiro/lancamentos", crumbs: [{ label: "Financeiro", to: "/financeiro/lancamentos" }, { label: "Lançamentos" }] },
  { pattern: "/financeiro/saldos", crumbs: [{ label: "Financeiro", to: "/financeiro/lancamentos" }, { label: "Saldos iniciais" }] },
  { pattern: "/relatorios", crumbs: [{ label: "Financeiro", to: "/financeiro/lancamentos" }, { label: "Relatórios" }] },

  { pattern: "/igreja/informacoes", crumbs: [{ label: "Igreja", to: "/igreja/informacoes" }, { label: "Informações" }] },
  { pattern: "/igreja/membros/novo", crumbs: [{ label: "Igreja", to: "/igreja/informacoes" }, { label: "Membros", to: "/igreja/membros" }, { label: "Novo" }] },
  { pattern: "/igreja/membros/:id/editar", crumbs: [{ label: "Igreja", to: "/igreja/informacoes" }, { label: "Membros", to: "/igreja/membros" }, { label: "Editar" }] },
  { pattern: "/igreja/membros", crumbs: [{ label: "Igreja", to: "/igreja/informacoes" }, { label: "Membros" }] },

  { pattern: "/ebd/dias/:id", crumbs: [{ label: "EBD", to: "/ebd/dias" }, { label: "Dias", to: "/ebd/dias" }, { label: "Dia" }] },
  { pattern: "/ebd/dias", crumbs: [{ label: "EBD", to: "/ebd/dias" }, { label: "Dias" }] },
  { pattern: "/ebd/matriculas", crumbs: [{ label: "EBD", to: "/ebd/dias" }, { label: "Matrículas" }] },
  { pattern: "/ebd/trimestre", crumbs: [{ label: "EBD", to: "/ebd/dias" }, { label: "Trimestre / Turma" }] },
]

export function AppBreadcrumb() {
  const { pathname } = useLocation()
  const match = ROUTES.find((r) => matchPath(r.pattern, pathname))
  const crumbs = match?.crumbs ?? []

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <React.Fragment key={crumb.label}>
              <BreadcrumbItem>
                {crumb.to && !isLast ? (
                  <BreadcrumbLink render={<Link to={crumb.to} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-heading font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
