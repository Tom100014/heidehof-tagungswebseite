
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './styles/admin-readability.css'
import './index.css'
import './styles/luxury-toast.css'
import { SafePWAProvider } from '@/components/pwa/SafePWAProvider'
import { ConfirmProvider } from '@/components/admin/ConfirmDialog'

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <SafePWAProvider>
              <ConfirmProvider>
                <App />
                <Toaster 
                  position="top-right"
                  expand={false}
                  closeButton
                  toastOptions={{
                    duration: 4000,
                  }}
                />
              </ConfirmProvider>
            </SafePWAProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>,
)
