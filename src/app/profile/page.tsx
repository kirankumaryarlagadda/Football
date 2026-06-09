'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      if (profile) setDisplayName(profile.display_name);
    };
    loadProfile();
  }, [supabase]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Profile updated!');
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a202c' }}>
          👤 Profile
        </h1>
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Email</label>
            <input className="input" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Display Name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          {message && (
            <div className={message.startsWith('Error') ? 'error-message' : 'success-message'} style={{ marginBottom: '1rem' }}>
              {message}
            </div>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
