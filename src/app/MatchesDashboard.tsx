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
            <Link href="/admin" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              ⚙️ Admin Panel
            </Link>
          </div>
        )}

        {/* LIVE MATCHES */}
        {liveMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <span>🔴 Live</span>
            </div>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {liveMatches.map((match) => {
                const pick = getUserPick(match.id);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ cursor: 'pointer', borderColor: 'rgba(255, 82, 82, 0.3)', position: 'relative', overflow: 'hidden' }}>
                      {/* Live glow effect */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--color-error), transparent)' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                          {match.group_letter ? `GROUP ${match.group_letter}` : getStageName(match.stage)} · #{match.match_number}
                        </div>
                        <span className="badge badge-live">● LIVE</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: getTeamColor(match.team1) }}>{match.team1}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team1)}</div>
                        </div>
                        <div style={{ padding: '0 12px', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>VS</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: getTeamColor(match.team2) }}>{match.team2}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team2)}</div>
                        </div>
                      </div>
                      
                      {pick && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, padding: '6px 0', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
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
            <div className="section-header">
              <span>📅 Upcoming ({upcomingMatches.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingMatches.map((match) => {
                const pick = getUserPick(match.id);
                const deadlinePassed = isPickDeadlinePassed(match.match_date);
                const countdown = getCountdown(match.match_date);
                const drawAllowed = isDrawAllowed(match.stage);
                const isPicking = pickingMatchId === match.id;

                return (
                  <div key={match.id} className="card" style={{ padding: '1rem 1.25rem', borderLeft: pick ? '3px solid var(--color-primary)' : '3px solid transparent' }}>
                    {/* Top row: meta info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {match.group_letter && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', background: 'var(--color-primary-dim)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.04em' }}>
                            GRP {match.group_letter}
                          </span>
                        )}
                        {match.stage !== 'group' && (
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                            🏆 {getStageName(match.stage)}
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>#{match.match_number}</span>
                      </div>
                      {!deadlinePassed && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 700, background: 'var(--color-error-dim)', padding: '3px 8px', borderRadius: 6 }}>
                          ⏱ {countdown}
                        </span>
                      )}
                    </div>

                    {/* Teams row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: getTeamColor(match.team1) }}>{getTeamFullName(match.team1)}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>VS</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: getTeamColor(match.team2) }}>{getTeamFullName(match.team2)}</span>
                    </div>

                    {/* Venue & time */}
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
                      📍 {match.venue} · {formatDate(match.match_date)}
                    </div>

                    {/* Pick section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {deadlinePassed ? (
                        <span className="badge badge-muted" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>🔒 Picks Closed</span>
                      ) : pick ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-primary-dim)', padding: '8px 16px', borderRadius: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            ✓ {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                          </span>
                          <button
                            onClick={() => handleResetPick(match.id)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--color-text-muted)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}
                            title="Change pick"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="pick-btn"
                            onClick={() => handlePick(match.id, match.team1)}
                            disabled={isPicking}
                            style={{ borderColor: getTeamColor(match.team1), color: getTeamColor(match.team1) }}
                          >
                            {match.team1}
                          </button>
                          {drawAllowed && (
                            <button
                              className="pick-btn"
                              onClick={() => handlePick(match.id, 'DRAW')}
                              disabled={isPicking}
                              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                            >
                              Draw
                            </button>
                          )}
                          <button
                            className="pick-btn"
                            onClick={() => handlePick(match.id, match.team2)}
                            disabled={isPicking}
                            style={{ borderColor: getTeamColor(match.team2), color: getTeamColor(match.team2) }}
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
            <div className="section-header">
              <span>✅ Completed ({completedMatches.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...completedMatches].reverse().map((match) => {
                const pick = getUserPick(match.id);
                const result = getPickResult(pick, match);
                const borderColor = result === 'correct' ? 'var(--color-success)' : result === 'wrong' ? 'var(--color-error)' : 'transparent';

                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.85rem 1.15rem', cursor: 'pointer', borderLeft: `3px solid ${borderColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: 3, letterSpacing: '0.04em' }}>
                            {match.group_letter ? `GRP ${match.group_letter} · ` : ''}#{match.match_number}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-heading)' }}>
                              {getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}
                            </span>
                            {match.winner === 'NR' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', background: 'rgba(107,130,153,0.15)', padding: '2px 8px', borderRadius: 4 }}>☔ No Result</span>
                            ) : match.winner === 'DRAW' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', background: 'var(--color-accent-dim)', padding: '2px 8px', borderRadius: 4 }}>🤝 Draw</span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: getTeamColor(match.winner!), background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>🏆 {getTeamFullName(match.winner!)}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          {result === 'correct' && <span className="badge badge-success">+{getMatchPoints(match.stage).correct}</span>}
                          {result === 'wrong' && <span className="badge badge-error">{getMatchPoints(match.stage).wrong}</span>}
                          {result === 'missed' && <span className="badge badge-muted">{getMatchPoints(match.stage).missed}</span>}
                          {result === 'nr' && <span className="badge badge-muted">0</span>}
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
            <p style={{ color: 'var(--color-text-muted)' }}>No matches scheduled yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}
