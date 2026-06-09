'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if force password reset is needed
    if (data.user?.user_metadata?.force_password_reset) {
      router.push('/force-reset');
      return;
    }

    router.push('/');
    router.refresh();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚽</div>
          <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            FWC Picks 2026
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {forgotMode ? 'Reset your password' : 'Sign in to make your picks'}
          </p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {resetSent ? (
          <div className="success-message">
            ✅ Password reset email sent! Check your inbox and click the link.
          </div>
        ) : forgotMode ? (
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(''); }}
                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                ← Back to Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setError(''); }}
                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                Forgot Password?
              </button>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {!forgotMode && !resetSent && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <a href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign Up</a>
          </p>
        )}
      </div>
    </div>
  );
}
