'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Match, Pick, MatchStage, getMatchTimeLocal, formatMatchDate } from '@/lib/types';
import { getTeamColor, getTeamFullName, isDrawAllowed } from '@/lib/teams';
import { getMatchPoints, getScoringTable, isNoResult, isDraw } from '@/lib/scoring';

interface Props {
  matches: Match[];
  userPicks: Pick[];
  allPicks: { match_id: string; picked_team: string }[];
  userId: string;
  isAdmin: boolean;
}

function getUserPick(userPicks: Pick[], matchId: string): Pick | undefined {
  return userPicks.find((p) => p.match_id === matchId);
}

function getPickDistribution(allPicks: { match_id: string; picked_team: string }[], matchId: string) {
  const matchPicks = allPicks.filter((p) => p.match_id === matchId);
  const total = matchPicks.length;
  if (total === 0) return { total: 0, teams: {} as Record<string, number> };
  const teams: Record<string, number> = {};
  matchPicks.forEach((p) => {
    teams[p.picked_team] = (teams[p.picked_team] || 0) + 1;
  });
  return { total, teams };
}

function isPickDeadlinePassed(matchDate: string): boolean {
  const deadline = new Date(new Date(matchDate).getTime() - 30 * 60 * 1000);
  return new Date() >= deadline;
}

function getCountdown(matchDate: string): string {
  const deadline = new Date(new Date(matchDate).getTime() - 30 * 60 * 1000);
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return '';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateLocal(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getPickResult(match: Match, pick: Pick | undefined): 'correct' | 'wrong' | 'missed' | 'nr' {
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

export default function MatchesDashboard({ matches, userPicks, allPicks, userId, isAdmin }: Props) {
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [pickingMatch, setPickingMatch] = useState<string | null>(null);
  const [localPicks, setLocalPicks] = useState<Pick[]>(userPicks);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const updateCountdowns = useCallback(() => {
    const cd: Record<string, string> = {};
    matches
      .filter((m) => m.status === 'upcoming')
      .forEach((m) => {
        cd[m.id] = getCountdown(m.match_date);
      });
    setCountdowns(cd);
  }, [matches]);

  useEffect(() => {
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60_000);
    return () => clearInterval(interval);
  }, [updateCountdowns]);

  const handlePick = async (matchId: string, team: string) => {
    setPickingMatch(matchId);
    setError(null);
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, picked_team: team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit pick');
      setLocalPicks((prev) => {
        const filtered = prev.filter((p) => p.match_id !== matchId);
        return [...filtered, data.pick];
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPickingMatch(null);
    }
  };

  const handleResetPick = async (matchId: string) => {
    setPickingMatch(matchId);
    setError(null);
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPickingMatch(null);
    }
  };

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const completedMatches = matches.filter((m) => m.status === 'completed').reverse();

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

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
              <span>🔴 Live Matches</span>
            </div>
            {liveMatches.map((match) => {
              const userPick = getUserPick(localPicks, match.id);
              const dist = getPickDistribution(allPicks, match.id);
              return (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                >
                  <div className="card" style={{ border: '2px solid rgba(255, 82, 82, 0.4)', position: 'relative', overflow: 'hidden' }}>
                    {/* Live glow bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--color-error), transparent)' }} />

                    {/* Live badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'var(--color-error)',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        animation: 'pulse 1.5s infinite',
                      }}
                    >
                      ● LIVE
                    </div>

                    {/* Stage badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        {match.group_letter ? `GROUP ${match.group_letter}` : getStageName(match.stage)} · #{match.match_number}
                      </span>
                      {match.stage !== 'group' && (
                        <span className="badge badge-gold">🏆 {getStageName(match.stage)}</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      📍 {match.venue}
                    </div>

                    {/* Teams VS */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '1rem 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: getTeamColor(match.team1) }}>
                          {match.team1}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team1)}</div>
                      </div>
                      <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>VS</span>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: getTeamColor(match.team2) }}>
                          {match.team2}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team2)}</div>
                      </div>
                    </div>

                    {/* User pick */}
                    {userPick && (
                      <div
                        style={{
                          textAlign: 'center',
                          marginBottom: 12,
                          padding: '6px 16px',
                          background: 'var(--color-primary-dim)',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          margin: '0 auto 12px',
                          width: 'fit-content',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                          Your Pick: {userPick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(userPick.picked_team)} ✅
                        </span>
                      </div>
                    )}

                    {/* Pick distribution */}
                    {dist.total > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                          <span>{match.team1} ({dist.teams[match.team1] || 0})</span>
                          <span>{dist.total} picks</span>
                          <span>{match.team2} ({dist.teams[match.team2] || 0})</span>
                        </div>
                        {dist.teams['DRAW'] && (
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-accent)', marginBottom: 4 }}>
                            🤝 Draw ({dist.teams['DRAW']})
                          </div>
                        )}
                        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          {(dist.teams[match.team1] || 0) > 0 && (
                            <div
                              style={{
                                width: `${((dist.teams[match.team1] || 0) / dist.total) * 100}%`,
                                background: getTeamColor(match.team1),
                                transition: 'width 0.3s',
                              }}
                            />
                          )}
                          {(dist.teams['DRAW'] || 0) > 0 && (
                            <div
                              style={{
                                width: `${((dist.teams['DRAW'] || 0) / dist.total) * 100}%`,
                                background: 'var(--color-accent)',
                                transition: 'width 0.3s',
                              }}
                            />
                          )}
                          {(dist.teams[match.team2] || 0) > 0 && (
                            <div
                              style={{
                                width: `${((dist.teams[match.team2] || 0) / dist.total) * 100}%`,
                                background: getTeamColor(match.team2),
                                transition: 'width 0.3s',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Details link */}
                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                      View Details →
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        {/* UPCOMING MATCHES */}
        {upcomingMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="section-header" style={{ marginBottom: 0 }}>
                <span>📅 Upcoming ({upcomingMatches.length})</span>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 3, border: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--color-card-solid)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  ▦ Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: viewMode === 'list' ? 'var(--color-card-solid)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  ☰ List
                </button>
              </div>
            </div>

            {/* GRID VIEW */}
            <div
              style={{
                display: viewMode === 'grid' ? 'grid' : 'none',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {upcomingMatches.map((match) => {
                const userPick = getUserPick(localPicks, match.id);
                const deadlinePassed = isPickDeadlinePassed(match.match_date);
                const cd = countdowns[match.id];
                const drawAllowed = isDrawAllowed(match.stage);
                const dist = getPickDistribution(allPicks, match.id);

                return (
                  <div key={match.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: userPick ? '3px solid var(--color-primary)' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          #{match.match_number}
                        </span>
                        {match.group_letter && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', background: 'var(--color-primary-dim)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.04em' }}>
                            GRP {match.group_letter}
                          </span>
                        )}
                      </div>
                      {match.stage !== 'group' && (
                        <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                          🏆 {getStageName(match.stage)}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {formatDateLocal(match.match_date)} · {formatTimeLocal(match.match_date)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📍 {match.venue}</div>

                    {/* Teams */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0.75rem 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: getTeamColor(match.team1) }}>
                          {match.team1}
                        </span>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team1)}</div>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>vs</span>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: getTeamColor(match.team2) }}>
                          {match.team2}
                        </span>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{getTeamFullName(match.team2)}</div>
                      </div>
                    </div>

                    {/* Countdown */}
                    {cd && !deadlinePassed && (
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600 }}>
                        ⏰ Pick closes in {cd}
                      </div>
                    )}

                    {/* Pick buttons or status */}
                    {deadlinePassed ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '10px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 12,
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        🔒 Picks Closed
                      </div>
                    ) : userPick ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-primary-dim)', padding: '8px 16px', borderRadius: 10 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            ✓ {userPick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(userPick.picked_team)}
                          </span>
                          <button
                            disabled={pickingMatch === match.id}
                            onClick={() => handleResetPick(match.id)}
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              color: 'var(--color-text-muted)',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontWeight: 700,
                            }}
                            title="Change pick"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[match.team1, ...(drawAllowed ? ['DRAW'] : []), match.team2].map((team) => {
                          const teamColor = team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(team);
                          return (
                            <button
                              key={team}
                              className="pick-btn"
                              disabled={pickingMatch === match.id}
                              onClick={() => handlePick(match.id, team)}
                              style={{
                                borderColor: teamColor,
                                color: teamColor,
                              }}
                            >
                              {team === 'DRAW' ? 'Draw' : team}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Pick count (without revealing picks) */}
                    {userPick && dist.total > 0 && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        🔒 {dist.total} pick{dist.total !== 1 ? 's' : ''} submitted so far
                      </div>
                    )}

                    <Link
                      href={`/match/${match.id}`}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        marginTop: 4,
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {upcomingMatches.map((match, i) => {
                  const userPick = getUserPick(localPicks, match.id);
                  const deadlinePassed = isPickDeadlinePassed(match.match_date);
                  const cd = countdowns[match.id];
                  const drawAllowed = isDrawAllowed(match.stage);
                  const dist = getPickDistribution(allPicks, match.id);

                  return (
                    <div
                      key={match.id}
                      style={{
                        padding: '14px 16px',
                        borderBottom: i < upcomingMatches.length - 1 ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      {/* Row 1: Match number + Teams + Countdown */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            #{match.match_number}
                          </span>
                          {match.group_letter && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', background: 'var(--color-primary-dim)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              GRP {match.group_letter}
                            </span>
                          )}
                          <span style={{ fontWeight: 800, color: getTeamColor(match.team1), fontSize: '0.95rem' }}>
                            {getTeamFullName(match.team1)}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>vs</span>
                          <span style={{ fontWeight: 800, color: getTeamColor(match.team2), fontSize: '0.95rem' }}>
                            {getTeamFullName(match.team2)}
                          </span>
                        </div>
                        {cd && !deadlinePassed && (
                          <span style={{ color: 'var(--color-error)', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', background: 'var(--color-error-dim)', padding: '3px 8px', borderRadius: 6 }}>
                            ⏰ {cd}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Date/time + Venue */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                        {formatDateLocal(match.match_date)} · {formatTimeLocal(match.match_date)} · 📍 {match.venue}
                      </div>

                      {/* Row 3: Pick buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {deadlinePassed ? (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>🔒 Closed</span>
                        ) : userPick ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                background: 'var(--color-primary-dim)',
                                color: 'var(--color-primary)',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              {userPick.picked_team === 'DRAW' ? '🤝 Draw' : userPick.picked_team} ✓
                            </span>
                            <button
                              disabled={pickingMatch === match.id}
                              onClick={() => handleResetPick(match.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              ↩
                            </button>
                            {dist.total > 0 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                🔒 {dist.total} picks
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[match.team1, ...(drawAllowed ? ['DRAW'] : []), match.team2].map((team) => {
                              const teamColor = team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(team);
                              return (
                                <button
                                  key={team}
                                  disabled={pickingMatch === match.id}
                                  onClick={() => handlePick(match.id, team)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${teamColor}`,
                                    background: 'transparent',
                                    color: teamColor,
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {team === 'DRAW' ? 'Draw' : team}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* View Details link */}
                      <div style={{ marginTop: 6, textAlign: 'right' }}>
                        <Link
                          href={`/match/${match.id}`}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* COMPLETED MATCHES */}
        {completedMatches.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <span>✅ Completed ({completedMatches.length})</span>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {completedMatches.map((match, i) => {
                const userPick = getUserPick(localPicks, match.id);
                const result = getPickResult(match, userPick);
                const stagePoints = getMatchPoints(match.stage);
                const points = result === 'nr' ? 0 : stagePoints[result];
                const isNR = match.winner === 'NR';
                const isMatchDraw = match.winner === 'DRAW';

                const badgeStyle: Record<string, { bg: string; color: string; emoji: string }> = {
                  correct: { bg: 'var(--color-primary-dim)', color: 'var(--color-success)', emoji: '✅' },
                  wrong: { bg: 'var(--color-error-dim)', color: 'var(--color-error)', emoji: '❌' },
                  missed: { bg: 'rgba(107,130,153,0.15)', color: 'var(--color-text-muted)', emoji: '⛔' },
                  nr: { bg: 'rgba(107,130,153,0.15)', color: 'var(--color-text-muted)', emoji: '☔' },
                };
                const bs = badgeStyle[result];

                return (
                  <Link
                    key={match.id}
                    href={`/match/${match.id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                        borderBottom: i < completedMatches.length - 1 ? '1px solid var(--color-border)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, minWidth: 64 }}>
                          #{match.match_number}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-body)' }}>
                          {isNR ? (
                            <>
                              <span>{getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}</span>
                              <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>☔ No Result</span>
                            </>
                          ) : isMatchDraw ? (
                            <>
                              <span>{getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}</span>
                              <span style={{ color: 'var(--color-accent)', marginLeft: 6 }}>🤝 Draw</span>
                            </>
                          ) : (
                            <>
                              <strong style={{ color: getTeamColor(match.winner!) }}>{getTeamFullName(match.winner!)}</strong>
                              {' beat '}
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                {getTeamFullName(match.winner === match.team1 ? match.team2 : match.team1)}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                      <div
                        style={{
                          background: bs.bg,
                          color: bs.color,
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {bs.emoji} {points > 0 ? '+' : ''}{points}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SCORING RULES */}
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-header">
            <span>📊 Scoring Rules</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {getScoringTable().map((row) => (
              <div
                key={row.stage}
                className="card"
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-text-heading)', fontSize: '0.9rem', marginBottom: 12 }}>
                  {row.stage === 'Group Stage' ? '⚽' : row.stage === 'Final' ? '🏆' : '⚔️'} {row.stage}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '1.1rem' }}>+{row.correct}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Correct</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: '1.1rem' }}>{row.wrong}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Wrong</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>{row.missed}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Missed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {matches.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
            <p style={{ color: 'var(--color-text-muted)' }}>No matches scheduled yet. Check back soon!</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
