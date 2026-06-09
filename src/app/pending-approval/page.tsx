'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', marginBottom: '0.5rem' }}>
          Awaiting Approval
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your account is pending admin approval. You&apos;ll be able to access the app once approved.
        </p>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
            color: '#a0aec0',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
