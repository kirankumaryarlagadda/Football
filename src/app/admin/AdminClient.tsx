'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Match, Profile, MatchStage } from '@/lib/types';
import { getTeamColor, getAllTeamAbbreviations, isDrawAllowed } from '@/lib/teams';

type TabKey = 'matches' | 'players' | 'settings';

interface Props {
  matches: Match[];
  profiles: Profile[];
  prizes: { first: number; second: number; third: number } | null;
  userId: string;
}

const ALL_TEAMS = getAllTeamAbbreviations();
const STATUSES = ['upcoming', 'live', 'completed'];
const STAGES: MatchStage[] = ['group', 'round32', 'round16', 'quarter', 'semi', 'bronze', 'final'];

export default function AdminClient({ matches: initialMatches, profiles: initialProfiles, prizes: initialPrizes, userId }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [activeTab, setActiveTab] = useState<TabKey>('matches');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ match_date?: string; match_hour?: string; venue?: string; status?: string; stage?: MatchStage; team1?: string; team2?: string }>({});
  const [prizes, setPrizes] = useState(initialPrizes || { first: 0, second: 0, third: 0 });
  const [prizeMessage, setPrizeMessage] = useState('');

  // Add match form
  const [addForm, setAddForm] = useState({
    match_number: '',
    team1: ALL_TEAMS[0],
    team2: ALL_TEAMS[1],
    match_date: '',
    match_hour: '19:00',
    venue: '',
    stage: 'group' as MatchStage,
    group_letter: '',
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/cron/update-results', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message || 'Sync complete');
      // Refresh page after sync
      window.location.reload();
    } catch {
      setSyncMessage('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetWinner = async (matchId: string, winner: string) => {
    if (!confirm(`Set winner to ${winner}?`)) return;
    const res = await fetch('/api/admin/set-winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, winner }),
    });
    if (res.ok) {
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, winner, status: 'completed' } : m));
    }
  };

  const handleEditMatch = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const updates: Record<string, any> = {};
    if (editForm.venue) updates.venue = editForm.venue;
    if (editForm.status) updates.status = editForm.status;
    if (editForm.stage) updates.stage = editForm.stage;
    if (editForm.team1) updates.team1 = editForm.team1;
    if (editForm.team2) updates.team2 = editForm.team2;
    if (editForm.match_date && editForm.match_hour) {
      updates.match_date = new Date(`${editForm.match_date}T${editForm.match_hour}:00`).toISOString();
    }

    const res = await fetch('/api/admin/edit-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, ...updates }),
    });

    if (res.ok) {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m))
      );
      setEditingMatch(null);
      setEditForm({});
    }
  };

  const handleAddMatch = async () => {
    const matchDate = new Date(`${addForm.match_date}T${addForm.match_hour}:00`).toISOString();
    const res = await fetch('/api/admin/add-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_number: parseInt(addForm.match_number),
        team1: addForm.team1,
        team2: addForm.team2,
        venue: addForm.venue,
        match_date: matchDate,
        stage: addForm.stage,
        group_letter: addForm.group_letter || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMatches((prev) => [...prev, data.match].sort((a, b) => a.match_number - b.match_number));
      setAddForm({ match_number: '', team1: ALL_TEAMS[0], team2: ALL_TEAMS[1], match_date: '', match_hour: '19:00', venue: '', stage: 'group', group_letter: '' });
    }
  };

  const handleApprove = async (profileId: string) => {
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', user_id: profileId }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_approved: true } : p));
    }
  };

  const handleReject = async (profileId: string) => {
    if (!confirm('Reject and delete this player?')) return;
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', user_id: profileId }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  const handleResetPassword = async (profileId: string) => {
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-password', user_id: profileId }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Temp password for ${data.email}:\n\n${data.temp_password}\n\nPlayer must change password on next login.`);
    }
  };

  const handleMakeAdmin = async (profileId: string) => {
    if (!confirm('Make this player an admin?')) return;
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'make-admin', user_id: profileId }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_admin: true } : p));
    }
  };

  const handleRemoveAdmin = async (profileId: string) => {
    if (!confirm('Remove admin rights from this player?')) return;
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove-admin', user_id: profileId }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_admin: false } : p));
    }
  };

  const handleRemovePlayer = async (profileId: string) => {
    if (!confirm('Remove this player permanently? This will delete all their picks.')) return;
    const res = await fetch('/api/admin/manage-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', user_id: profileId }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  const handleSavePrizes = async () => {
    const res = await fetch('/api/admin/update-prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes, key: 'fwc_prizes' }),
    });
    setPrizeMessage(res.ok ? 'Saved!' : 'Error saving');
    setTimeout(() => setPrizeMessage(''), 2000);
  };

  const inputStyle = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', width: '100%' };
  const selectStyle = { ...inputStyle };

  const tabs = [
    { key: 'matches' as TabKey, label: '⚽ Matches' },
    { key: 'players' as TabKey, label: '👥 Players' },
    { key: 'settings' as TabKey, label: '⚙️ Settings' },
  ];

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#1a202c' }}>⚙️ Admin Panel</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.key ? '#667eea' : '#f0f0f0',
                color: activeTab === tab.key ? 'white' : '#4a5568',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSync}
                disabled={syncing}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#48bb78', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync Results'}
              </button>
              {syncMessage && <span style={{ fontSize: '0.8rem', color: '#a0aec0', alignSelf: 'center' }}>{syncMessage}</span>}
            </div>

            {/* Add match form */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>➕ Add Match</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                <input style={inputStyle} placeholder="Match #" value={addForm.match_number} onChange={(e) => setAddForm((p) => ({ ...p, match_number: e.target.value }))} />
                <select style={selectStyle} value={addForm.team1} onChange={(e) => setAddForm((p) => ({ ...p, team1: e.target.value }))}>
                  {ALL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={selectStyle} value={addForm.team2} onChange={(e) => setAddForm((p) => ({ ...p, team2: e.target.value }))}>
                  {ALL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={inputStyle} type="date" value={addForm.match_date} onChange={(e) => setAddForm((p) => ({ ...p, match_date: e.target.value }))} />
                <input style={inputStyle} type="time" value={addForm.match_hour} onChange={(e) => setAddForm((p) => ({ ...p, match_hour: e.target.value }))} />
                <input style={inputStyle} placeholder="Venue" value={addForm.venue} onChange={(e) => setAddForm((p) => ({ ...p, venue: e.target.value }))} />
                <select style={selectStyle} value={addForm.stage} onChange={(e) => setAddForm((p) => ({ ...p, stage: e.target.value as MatchStage }))}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input style={inputStyle} placeholder="Group (A-L)" value={addForm.group_letter} onChange={(e) => setAddForm((p) => ({ ...p, group_letter: e.target.value.toUpperCase() }))} />
                <button onClick={handleAddMatch} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#667eea', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Add</button>
              </div>
            </div>

            {/* Match list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matches.map((match) => (
                <div key={match.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                        #{match.match_number} · {match.group_letter ? `Grp ${match.group_letter}` : match.stage} · {match.status}
                      </div>
                      <div style={{ fontWeight: 700 }}>
                        <span style={{ color: getTeamColor(match.team1) }}>{match.team1}</span>
                        <span style={{ color: '#a0aec0' }}> vs </span>
                        <span style={{ color: getTeamColor(match.team2) }}>{match.team2}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0' }}>{match.venue}</div>
                      {match.winner && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: match.winner === 'NR' ? '#a0aec0' : match.winner === 'DRAW' ? '#b7791f' : getTeamColor(match.winner) }}>
                          {match.winner === 'NR' ? '☔ No Result' : match.winner === 'DRAW' ? '🤝 Draw' : `🏆 ${match.winner}`}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Set winner buttons */}
                      {match.status !== 'upcoming' && !match.winner && (
                        <>
                          <button onClick={() => handleSetWinner(match.id, match.team1)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${getTeamColor(match.team1)}`, background: 'white', color: getTeamColor(match.team1), fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>{match.team1}</button>
                          {isDrawAllowed(match.stage) && (
                            <button onClick={() => handleSetWinner(match.id, 'DRAW')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #b7791f', background: 'white', color: '#b7791f', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Draw</button>
                          )}
                          <button onClick={() => handleSetWinner(match.id, match.team2)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${getTeamColor(match.team2)}`, background: 'white', color: getTeamColor(match.team2), fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>{match.team2}</button>
                          <button onClick={() => handleSetWinner(match.id, 'NR')} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #a0aec0', background: 'white', color: '#a0aec0', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>☔ NR</button>
                        </>
                      )}
                      <button onClick={() => { setEditingMatch(editingMatch === match.id ? null : match.id); setEditForm({}); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: '0.7rem', cursor: 'pointer' }}>✏️</button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {editingMatch === match.id && (
                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                      <select style={selectStyle} value={editForm.team1 || match.team1} onChange={(e) => setEditForm((p) => ({ ...p, team1: e.target.value }))}>
                        {['TBD', ...ALL_TEAMS].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select style={selectStyle} value={editForm.team2 || match.team2} onChange={(e) => setEditForm((p) => ({ ...p, team2: e.target.value }))}>
                        {['TBD', ...ALL_TEAMS].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input style={inputStyle} type="date" value={editForm.match_date || ''} onChange={(e) => setEditForm((p) => ({ ...p, match_date: e.target.value }))} />
                      <input style={inputStyle} type="time" value={editForm.match_hour || ''} onChange={(e) => setEditForm((p) => ({ ...p, match_hour: e.target.value }))} />
                      <input style={inputStyle} placeholder="Venue" value={editForm.venue || ''} onChange={(e) => setEditForm((p) => ({ ...p, venue: e.target.value }))} />
                      <select style={selectStyle} value={editForm.status || match.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select style={selectStyle} value={editForm.stage || match.stage} onChange={(e) => setEditForm((p) => ({ ...p, stage: e.target.value as MatchStage }))}>
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => handleEditMatch(match.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#667eea', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>💾 Save</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-heading)' }}>Player Management ({profiles.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profiles.map((p) => {
                const isYou = p.id === userId;
                const isOtherAdmin = p.is_admin && !isYou;
                return (
                  <div key={p.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderLeft: p.is_admin ? '3px solid var(--color-accent)' : p.is_approved ? '3px solid var(--color-success)' : '3px solid var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.is_admin ? 'linear-gradient(135deg, var(--color-accent), #f59e0b)' : 'linear-gradient(135deg, var(--color-primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                        {p.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-heading)' }}>{p.display_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.email}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>🎫 {new Date(p.created_at).toLocaleDateString()}</span>
                          {p.is_admin && <span className="badge badge-gold">ADMIN</span>}
                          {!p.is_admin && p.is_approved && <span className="badge badge-success">Approved ✓</span>}
                          {!p.is_approved && <span className="badge badge-error">Pending</span>}
                          {isYou && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>(You)</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!p.is_approved && (
                        <>
                          <button onClick={() => handleApprove(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--color-success)', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✅ Approve</button>
                          <button onClick={() => handleReject(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--color-error)', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>❌ Reject</button>
                        </>
                      )}
                      {p.is_approved && !isYou && (
                        <>
                          <button onClick={() => handleResetPassword(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border-bright)', background: 'var(--color-card)', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-text-body)' }}>🔑 Reset Password</button>
                          {!p.is_admin && (
                            <button onClick={() => handleMakeAdmin(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border-bright)', background: 'var(--color-card)', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-text-body)' }}>🔥 Make Admin</button>
                          )}
                          {isOtherAdmin && (
                            <button onClick={() => handleRemoveAdmin(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border-bright)', background: 'var(--color-card)', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-text-body)' }}>📋 Remove Admin</button>
                          )}
                          {!p.is_admin && (
                            <button onClick={() => handleRemovePlayer(p.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border-bright)', background: 'var(--color-card)', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-error)' }}>🗑 Remove</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 Prize Pool</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="label">🥇 1st Place (₹)</label>
                <input className="input" type="number" value={prizes.first} onChange={(e) => setPrizes((p) => ({ ...p, first: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">🥈 2nd Place (₹)</label>
                <input className="input" type="number" value={prizes.second} onChange={(e) => setPrizes((p) => ({ ...p, second: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">🥉 3rd Place (₹)</label>
                <input className="input" type="number" value={prizes.third} onChange={(e) => setPrizes((p) => ({ ...p, third: parseInt(e.target.value) || 0 }))} />
              </div>
              <button onClick={handleSavePrizes} className="btn-primary">Save Prizes</button>
              {prizeMessage && <span style={{ fontSize: '0.8rem', color: '#48bb78' }}>{prizeMessage}</span>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
