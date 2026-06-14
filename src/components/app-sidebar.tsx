"use client"

import * as React from "react"

import logoIgreja from "@/assets/logo-igreja.png"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "@/features/acesso/use-session"
import { WalletIcon, ChurchIcon, BookOpenIcon } from "lucide-react"

const data = {
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
    {
      title: "EBD",
      url: "/ebd/dias",
      icon: (
        <BookOpenIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Dias",
          url: "/ebd/dias",
        },
        {
          title: "Matrículas",
          url: "/ebd/matriculas",
        },
        {
          title: "Trimestre / Turma",
          url: "/ebd/trimestre",
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center">
                <img
                  src={logoIgreja}
                  alt="Logo da igreja"
                  className="size-8 object-contain"
                />
              </div>
              <span className="truncate font-heading text-sm font-medium">
                AD MINISTÉRIO LIVRE
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
