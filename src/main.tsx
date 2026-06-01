import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import Layout from './layout.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import LancamentosPage from './pages/financeiro/lancamentos.tsx'
import NovaTransacaoPage from './pages/financeiro/nova-transacao.tsx'
import SaldosPage from './pages/financeiro/saldos.tsx'
import RelatoriosPage from './pages/relatorios/index.tsx'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/financeiro/lancamentos" replace /> },
      { path: 'financeiro/novo', element: <NovaTransacaoPage /> },
      { path: 'financeiro/lancamentos', element: <LancamentosPage /> },
      { path: 'financeiro/saldos', element: <SaldosPage /> },
      { path: 'relatorios', element: <RelatoriosPage /> },
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
