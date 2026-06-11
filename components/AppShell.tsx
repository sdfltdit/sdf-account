'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'

export default function AppShell({ title, children, actions }: {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setChecked(true)
    })
  }, [router])

  if (!checked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--red)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="mob-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-right">{actions}</div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
