'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();
      if (profile) {
        setDisplayName(profile.display_name);
        setOriginalName(profile.display_name);
        setEmail(profile.email);
      }
      setLoading(false);
    };
    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim() === originalName) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setOriginalName(displayName.trim());
      setDisplayName(displayName.trim());
      setMessage({ type: 'success', text: 'Display name updated! 🎉' });
      setTimeout(() => router.refresh(), 500);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = displayName.trim() !== originalName;

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 500, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ color: 'var(--color-text-heading)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          👤 Profile
        </h1>
        {message && (
          <div className={message.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: '1rem' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div className="card">
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Email</label>
              <div style={{ padding: '12px 16px', background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                {email}
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="displayName" className="label">Display Name</label>
              <input id="displayName" type="text" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your display name" maxLength={30} minLength={2} required style={{ fontSize: '1rem' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'right' }}>{displayName.length}/30</div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving || !hasChanged} style={{ opacity: hasChanged ? 1 : 0.5, cursor: hasChanged ? 'pointer' : 'default' }}>
              {saving ? 'Saving...' : hasChanged ? 'Save Changes' : 'No Changes'}
            </button>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              <strong>Rules:</strong><br />
              • Name must be 2-30 characters<br />
              • Can only change once per 24 hours<br />
              • Previously used names are reserved (no stealing)
            </div>
          </div>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>← Back to Matches</a>
        </div>
      </main>
    </>
  );
}
