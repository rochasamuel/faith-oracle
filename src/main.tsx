import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import Layout from './layout.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { RequireAuth } from './features/acesso/require-auth.tsx'
import EntrarPage from './pages/entrar.tsx'
import LancamentosPage from './pages/financeiro/lancamentos.tsx'
import SaldosPage from './pages/financeiro/saldos.tsx'
import RelatoriosPage from './pages/relatorios/index.tsx'
import InformacoesPage from './pages/igreja/informacoes.tsx'
import MembrosPage from './pages/igreja/membros.tsx'
import MembroFormPage from './pages/igreja/membro-form-page.tsx'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  { path: '/entrar', element: <EntrarPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/financeiro/lancamentos" replace /> },
          { path: 'financeiro/lancamentos', element: <LancamentosPage /> },
          { path: 'financeiro/saldos', element: <SaldosPage /> },
          { path: 'relatorios', element: <RelatoriosPage /> },
          { path: 'igreja/informacoes', element: <InformacoesPage /> },
          { path: 'igreja/membros', element: <MembrosPage /> },
          { path: 'igreja/membros/novo', element: <MembroFormPage /> },
          { path: 'igreja/membros/:id/editar', element: <MembroFormPage /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
