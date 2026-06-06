"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "@/features/acesso/use-session"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, WalletIcon, ChurchIcon } from "lucide-react"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Financeiro",
      url: "/financeiro/lancamentos",
      icon: (
        <WalletIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Lançamentos",
          url: "/financeiro/lancamentos",
        },
        {
          title: "Saldos iniciais",
          url: "/financeiro/saldos",
        },
        {
          title: "Relatórios",
          url: "/relatorios",
        },
      ],
    },
    {
      title: "Igreja",
      url: "/igreja/informacoes",
      icon: (
        <ChurchIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Informações",
          url: "/igreja/informacoes",
        },
        {
          title: "Membros",
          url: "/igreja/membros",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session } = useSession()
  const authUser = session?.user
  const user = {
    name:
      (authUser?.user_metadata?.full_name as string | undefined) ??
      authUser?.email ??
      "Usuário",
    email: authUser?.email ?? "",
    avatar: (authUser?.user_metadata?.avatar_url as string | undefined) ?? "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
