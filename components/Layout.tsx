'use client'

import { ReactNode } from 'react'
import Navbar from './Navbar'
import AlertsBar from './AlertsBar'

interface LayoutProps {
  children: ReactNode
  showAlerts?: boolean
}

export default function Layout({ children, showAlerts = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bs-bg">
      <Navbar />
      {showAlerts && <AlertsBar />}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
