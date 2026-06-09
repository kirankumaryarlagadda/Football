'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { LeaderboardEntry } from '@/lib/types';

export default function LeaderboardClient({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.leaderboard || []);
        setLoading(false);
      });
  }, []);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a202c' }}>
          🏆 Leaderboard
        </h1>

        {loading ? (
          <p style={{ color: '#a0aec0', textAlign: 'center' }}>Loading...</p>
        ) : entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#a0aec0' }}>No results yet. Leaderboard will appear after the first match completes.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }} className="leaderboard-header">
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rank</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Player</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pts</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>✅</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>❌</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>⏭</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>🔥</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className="leaderboard-row"
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: entry.user_id === userId ? 'rgba(102,126,234,0.05)' : undefined,
                      }}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{getMedal(entry.rank)}</td>
                      <td style={{ padding: '0.75rem', fontWeight: entry.user_id === userId ? 700 : 500 }}>
                        {entry.display_name} {entry.user_id === userId && <span style={{ fontSize: '0.7rem', color: '#667eea' }}>YOU</span>}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: entry.total_points >= 0 ? '#48bb78' : '#f56565' }}>{entry.total_points}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{entry.correct_picks}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{entry.wrong_picks}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{entry.missed_picks}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{entry.longest_streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              {entries.map((entry) => (
                <div
                  key={entry.user_id}
                  className="leaderboard-card"
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f0f0f0',
                    background: entry.user_id === userId ? 'rgba(102,126,234,0.05)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{getMedal(entry.rank)} {entry.display_name}</span>
                    <span style={{ fontWeight: 800, color: entry.total_points >= 0 ? '#48bb78' : '#f56565' }}>{entry.total_points} pts</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#a0aec0' }}>
                    <span>✅ {entry.correct_picks}</span>
                    <span>❌ {entry.wrong_picks}</span>
                    <span>⏭ {entry.missed_picks}</span>
                    <span>🔥 {entry.longest_streak}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
