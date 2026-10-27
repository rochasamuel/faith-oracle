import { BookOpenIcon, ChurchIcon, WalletIcon, type LucideIcon } from "lucide-react"
import { matchPath } from "react-router"

export interface NavPage {
  title: string
  url: string
  /** Rotas filhas que também marcam esta página como ativa. */
  match?: string[]
}

export interface NavSection {
  id: string
  title: string
  icon: LucideIcon
  url: string
  pages: NavPage[]
}

/** Seções do livro: cada uma vira um grupo no trilho e uma aba no celular. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "ebd",
    title: "EBD",
    icon: BookOpenIcon,
    url: "/ebd/dias",
    pages: [
      { title: "Dias de aula", url: "/ebd/dias", match: ["/ebd/dias/:id"] },
      { title: "Matrículas", url: "/ebd/matriculas" },
      { title: "Trimestre e turma", url: "/ebd/trimestre" },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: WalletIcon,
    url: "/financeiro/lancamentos",
    pages: [
      { title: "Lançamentos", url: "/financeiro/lancamentos" },
      { title: "Saldos iniciais", url: "/financeiro/saldos" },
      { title: "Relatórios", url: "/relatorios" },
    ],
  },
  {
    id: "igreja",
    title: "Igreja",
    icon: ChurchIcon,
    url: "/igreja/membros",
    pages: [
      {
        title: "Membros",
        url: "/igreja/membros",
        match: ["/igreja/membros/novo", "/igreja/membros/:id/editar"],
      },
      { title: "Informações", url: "/igreja/informacoes" },
    ],
  },
]

export function isPageActive(page: NavPage, pathname: string): boolean {
  return [page.url, ...(page.match ?? [])].some((p) => matchPath(p, pathname))
}

export function findSection(pathname: string): NavSection | undefined {
  return NAV_SECTIONS.find((s) => s.pages.some((p) => isPageActive(p, pathname)))
}
