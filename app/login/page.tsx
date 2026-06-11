'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--ink)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>S</span>
          </div>
          <h1 style={{ fontFamily: '"EB Garamond", serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            SDF Clothing
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Internal Admin
          </p>
        </div>

        {/* Card */}
        <div className="card card-pad">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: 'var(--ink)' }}>Sign in</h2>
          <form onSubmit={handleLogin}>
            <div className="f">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@sdfltd.com" required autoFocus />
            </div>
            <div className="f">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--red-dk)', marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '12px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 20 }}>
          🔒 Private — SDF team only
        </p>
      </div>
    </div>
  )
}
