import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLogin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  if (user) {
    navigate('/admin', { replace: true })
    return null
  }

  async function signInWithGoogle() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      navigate('/admin', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      setSigningIn(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px', width: '100%' }}>
        <div style={{ fontFamily: 'Bungee, sans-serif', fontSize: 28, color: '#fff', marginBottom: 4 }}>
          Sky<span style={{ color: '#D81818' }}>Quest</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#555', marginBottom: 48 }}>
          Admin Panel
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={signingIn}
          style={{
            background: '#fff', color: '#111', border: 'none', borderRadius: 8,
            padding: '13px 28px', fontSize: 14, fontWeight: 600,
            cursor: signingIn ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '0 auto', opacity: signingIn ? 0.7 : 1,
            transition: 'opacity .15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
          </svg>
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>

        {error && (
          <p style={{ color: '#ef5350', marginTop: 16, fontSize: 13, lineHeight: 1.5 }}>{error}</p>
        )}

        <p style={{ fontSize: 11, color: '#444', marginTop: 40 }}>
          SkyQuest admin access only.
        </p>
      </div>
    </div>
  )
}
