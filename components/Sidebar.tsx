'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const nav = [
  { section: 'Overview', links: [
    { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  ]},
  { section: 'Invoices', links: [
    { href: '/invoices', label: 'All Invoices', icon: '◧' },
    { href: '/new-invoice', label: 'New Invoice', icon: '＋' },
  ]},
  { section: 'Business', links: [
    { href: '/clients', label: 'Clients', icon: '◎' },
    { href: '/payments', label: 'Payments', icon: '◈' },
  ]},
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <>
      <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-row">
            <div className="sidebar-logo">S</div>
            <span className="sidebar-name">SDF Clothing</span>
          </div>
          <span className="sidebar-sub">Invoice Admin</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map(section => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href || pathname.startsWith(link.href + '/') ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link" onClick={signOut} style={{ color: '#e8a0a2' }}>
            <span className="nav-icon">→</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
