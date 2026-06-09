'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Match, Pick, MatchStage, getMatchTimeLocal, formatMatchDate } from '@/lib/types';
import { getTeamColor, getTeamFullName, isDrawAllowed } from '@/lib/teams';
import { getMatchPoints, isNoResult, isDraw } from '@/lib/scoring';

interface Props {
  matches: Match[];
  userPicks: Pick[];
  userId: string;
  isAdmin: boolean;
}

function isPickDeadlinePassed(matchDate: string): boolean {
  const deadline = new Date(new Date(matchDate).getTime() - 30 * 60 * 1000);
  return new Date() >= deadline;
}

function getCountdown(matchDate: string): string {
  const deadline = new Date(new Date(matchDate).getTime() - 30 * 60 * 1000);
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getPickResult(pick: Pick | undefined, match: Match): 'correct' | 'wrong' | 'missed' | 'nr' {
  if (match.winner === 'NR') return 'nr';
  if (!pick) return 'missed';
  return pick.picked_team === match.winner ? 'correct' : 'wrong';
}

function getStageName(stage: MatchStage): string {
  switch (stage) {
    case 'group': return 'GROUP';
    case 'round32': return 'ROUND OF 32';
    case 'round16': return 'ROUND OF 16';
    case 'quarter': return 'QUARTER-FINAL';
    case 'semi': return 'SEMI-FINAL';
    case 'bronze': return 'BRONZE FINAL';
    case 'final': return 'FINAL';
    default: return (stage as string).toUpperCase();
  }
}

export default function MatchesDashboard({ matches, userPicks, userId, isAdmin }: Props) {
  const [localPicks, setLocalPicks] = useState<Pick[]>(userPicks);
  const [error, setError] = useState('');
  const [pickingMatchId, setPickingMatchId] = useState<string | null>(null);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  const getUserPick = (matchId: string) => localPicks.find((p) => p.match_id === matchId);

  const handlePick = async (matchId: string, team: string) => {
    setError('');
    setPickingMatchId(matchId);
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, picked_team: team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save pick');
      setLocalPicks((prev) => {
        const filtered = prev.filter((p) => p.match_id !== matchId);
        return [...filtered, data.pick];
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPickingMatchId(null);
    }
  };

  const handleResetPick = async (matchId: string) => {
    setError('');
    try {
      const res = await fetch('/api/picks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset pick');
      }
      setLocalPicks((prev) => prev.filter((p) => p.match_id !== matchId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${getMatchTimeLocal(dateStr)}`;
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {isAdmin && (
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link href="/admin" style={{ color: '#667eea', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              ⚙️ Admin Panel
            </Link>
          </div>
        )}

        {/* LIVE MATCHES */}
        {liveMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1a202c' }}>
              🔴 Live Matches
            </h2>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {liveMatches.map((match) => {
                const pick = getUserPick(match.id);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ position: 'relative', cursor: 'pointer', borderLeft: '4px solid #f56565' }}>
                      <span className="badge badge-error" style={{ position: 'absolute', top: 12, right: 12, animation: 'pulse 2s infinite' }}>● LIVE</span>
                      {match.stage !== 'group' && (
                        <div style={{ marginBottom: 8 }}>
                          <span className="badge badge-gold">🏆 {getStageName(match.stage)}</span>
                        </div>
                      )}
                      {match.group_letter && (
                        <div style={{ fontSize: '0.7rem', color: '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Group {match.group_letter} · Match #{match.match_number}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '0.75rem 0' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getTeamColor(match.team1) }}>{getTeamFullName(match.team1)}</span>
                        <span style={{ color: '#cbd5e0', fontSize: '0.75rem', fontWeight: 600 }}>VS</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getTeamColor(match.team2) }}>{getTeamFullName(match.team2)}</span>
                      </div>
                      {pick && (
                        <div style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 600, textAlign: 'center' }}>
                          Your pick: {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* UPCOMING MATCHES */}
        {upcomingMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1a202c' }}>
              📅 Upcoming Matches ({upcomingMatches.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingMatches.map((match) => {
                const pick = getUserPick(match.id);
                const deadlinePassed = isPickDeadlinePassed(match.match_date);
                const countdown = getCountdown(match.match_date);
                const drawAllowed = isDrawAllowed(match.stage);
                const isPicking = pickingMatchId === match.id;

                return (
                  <div key={match.id} className="card" style={{ padding: '1rem 1.25rem', borderLeft: pick ? '4px solid #667eea' : '4px solid #e2e8f0' }}>
                    {/* Header row: group/stage + countdown */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {match.group_letter && (
                          <span style={{ fontSize: '0.65rem', color: '#fff', background: '#667eea', padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.5px' }}>
                            GRP {match.group_letter}
                          </span>
                        )}
                        {match.stage !== 'group' && (
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                            🏆 {getStageName(match.stage)}
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>#{match.match_number}</span>
                      </div>
                      {!deadlinePassed && (
                        <span style={{ fontSize: '0.7rem', color: '#f56565', fontWeight: 700, background: 'rgba(245,101,101,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                          ⏱ {countdown}
                        </span>
                      )}
                    </div>

                    {/* Teams */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: getTeamColor(match.team1) }}>{getTeamFullName(match.team1)}</span>
                      <span style={{ color: '#cbd5e0', fontSize: '0.75rem', fontWeight: 600 }}>VS</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: getTeamColor(match.team2) }}>{getTeamFullName(match.team2)}</span>
                    </div>

                    {/* Date & venue */}
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 12 }}>
                      📍 {match.venue} · {formatDate(match.match_date)}
                    </div>

                    {/* Pick buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {deadlinePassed ? (
                        <span className="badge badge-muted" style={{ padding: '6px 16px' }}>🔒 Picks Closed</span>
                      ) : pick ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(102,126,234,0.06)', padding: '8px 16px', borderRadius: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pick.picked_team === 'DRAW' ? '#b7791f' : getTeamColor(pick.picked_team) }}>
                            ✓ {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                          </span>
                          <button
                            onClick={() => handleResetPick(match.id)}
                            style={{ background: 'rgba(160,174,192,0.2)', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#718096', borderRadius: 4, padding: '2px 6px' }}
                            title="Change pick"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePick(match.id, match.team1)}
                            disabled={isPicking}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 10,
                              border: `2px solid ${getTeamColor(match.team1)}`,
                              background: 'white',
                              color: getTeamColor(match.team1),
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {match.team1}
                          </button>
                          {drawAllowed && (
                            <button
                              onClick={() => handlePick(match.id, 'DRAW')}
                              disabled={isPicking}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 10,
                                border: '2px solid #d69e2e',
                                background: 'white',
                                color: '#d69e2e',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              Draw
                            </button>
                          )}
                          <button
                            onClick={() => handlePick(match.id, match.team2)}
                            disabled={isPicking}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 10,
                              border: `2px solid ${getTeamColor(match.team2)}`,
                              background: 'white',
                              color: getTeamColor(match.team2),
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {match.team2}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* COMPLETED MATCHES */}
        {completedMatches.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#1a202c' }}>
              ✅ Completed ({completedMatches.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...completedMatches].reverse().map((match) => {
                const pick = getUserPick(match.id);
                const result = getPickResult(pick, match);
                const borderColor = result === 'correct' ? '#48bb78' : result === 'wrong' ? '#f56565' : result === 'nr' ? '#a0aec0' : '#e2e8f0';
                const bgColor = result === 'correct' ? 'rgba(72,187,120,0.04)' : result === 'wrong' ? 'rgba(245,101,101,0.04)' : 'rgba(160,174,192,0.04)';

                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', background: bgColor, cursor: 'pointer', borderLeft: `4px solid ${borderColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginBottom: 2 }}>
                            {match.group_letter ? `Grp ${match.group_letter} · ` : ''}#{match.match_number}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}
                          </span>
                          {match.winner === 'NR' ? (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#a0aec0' }}>☔ No Result</span>
                          ) : match.winner === 'DRAW' ? (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#d69e2e' }}>🤝 Draw</span>
                          ) : (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: getTeamColor(match.winner!) }}>🏆 {getTeamFullName(match.winner!)}</span>
                          )}
                        </div>
                        <div>
                          {result === 'correct' && <span className="badge badge-success">✅ +{getMatchPoints(match.stage).correct}</span>}
                          {result === 'wrong' && <span className="badge badge-error">❌ {getMatchPoints(match.stage).wrong}</span>}
                          {result === 'missed' && <span className="badge badge-muted">⏭ {getMatchPoints(match.stage).missed}</span>}
                          {result === 'nr' && <span className="badge badge-muted">☔ 0</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
            <p style={{ color: '#a0aec0' }}>No matches scheduled yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
