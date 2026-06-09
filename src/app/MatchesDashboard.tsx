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
                    <div className="card" style={{ position: 'relative', cursor: 'pointer' }}>
                      <span className="badge badge-error" style={{ position: 'absolute', top: 12, right: 12 }}>LIVE</span>
                      {match.stage !== 'group' && (
                        <div className="badge badge-gold" style={{ marginBottom: 8 }}>
                          🏆 {getStageName(match.stage)}
                        </div>
                      )}
                      {match.group_letter && (
                        <div style={{ fontSize: '0.7rem', color: '#a0aec0', fontWeight: 600, marginBottom: 4 }}>
                          GROUP {match.group_letter} · Match #{match.match_number}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getTeamColor(match.team1) }}>{getTeamFullName(match.team1)}</span>
                        <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>vs</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: getTeamColor(match.team2) }}>{getTeamFullName(match.team2)}</span>
                      </div>
                      {pick && (
                        <div style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 600 }}>
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
                  <div key={match.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* Left: match info */}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {match.group_letter && (
                            <span style={{ fontSize: '0.7rem', color: '#a0aec0', fontWeight: 600 }}>
                              Grp {match.group_letter}
                            </span>
                          )}
                          {match.stage !== 'group' && (
                            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                              🏆 {getStageName(match.stage)}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>#{match.match_number}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: getTeamColor(match.team1) }}>{getTeamFullName(match.team1)}</span>
                          <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>vs</span>
                          <span style={{ fontWeight: 700, color: getTeamColor(match.team2) }}>{getTeamFullName(match.team2)}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 4 }}>
                          {formatDate(match.match_date)} · {match.venue}
                        </div>
                      </div>

                      {/* Right: pick buttons or countdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!deadlinePassed && <span style={{ fontSize: '0.7rem', color: '#f56565', fontWeight: 600, marginRight: 8 }}>⏱ {countdown}</span>}
                        
                        {deadlinePassed ? (
                          <span className="badge badge-muted">Closed</span>
                        ) : pick ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: pick.picked_team === 'DRAW' ? '#b7791f' : getTeamColor(pick.picked_team) }}>
                              {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                            </span>
                            <button
                              onClick={() => handleResetPick(match.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#a0aec0' }}
                              title="Reset pick"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => handlePick(match.id, match.team1)}
                              disabled={isPicking}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                border: `2px solid ${getTeamColor(match.team1)}`,
                                background: 'white',
                                color: getTeamColor(match.team1),
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              {getTeamFullName(match.team1)}
                            </button>
                            {drawAllowed && (
                              <button
                                onClick={() => handlePick(match.id, 'DRAW')}
                                disabled={isPicking}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  border: '2px solid #b7791f',
                                  background: 'white',
                                  color: '#b7791f',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Draw
                              </button>
                            )}
                            <button
                              onClick={() => handlePick(match.id, match.team2)}
                              disabled={isPicking}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                border: `2px solid ${getTeamColor(match.team2)}`,
                                background: 'white',
                                color: getTeamColor(match.team2),
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              {getTeamFullName(match.team2)}
                            </button>
                          </div>
                        )}
                      </div>
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
                const bgColor = result === 'correct' ? 'rgba(72,187,120,0.05)' : result === 'wrong' ? 'rgba(245,101,101,0.05)' : result === 'nr' ? 'rgba(160,174,192,0.05)' : 'rgba(245,101,101,0.03)';

                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', background: bgColor, cursor: 'pointer' }}>
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
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#b7791f' }}>🤝 Draw</span>
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
