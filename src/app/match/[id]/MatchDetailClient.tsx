'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Match, Pick, MatchStage, getMatchTimeLocal, formatMatchDate } from '@/lib/types';
import { getTeamColor, getTeamFullName, isDrawAllowed } from '@/lib/teams';
import { getMatchPoints, isNoResult, isDraw } from '@/lib/scoring';

interface Props {
  match: Match;
  picks: Pick[];
  userPick: Pick | null;
  userId: string;
  profiles: { id: string; display_name: string }[];
  totalPickCount: number;
}

function isPickDeadlinePassed(matchDate: string): boolean {
  return new Date() >= new Date(matchDate);
}

function getStageName(stage: MatchStage): string {
  switch (stage) {
    case 'group': return 'GROUP STAGE';
    case 'round32': return 'ROUND OF 32';
    case 'round16': return 'ROUND OF 16';
    case 'quarter': return 'QUARTER-FINAL';
    case 'semi': return 'SEMI-FINAL';
    case 'bronze': return 'BRONZE FINAL';
    case 'final': return 'FINAL';
    default: return (stage as string).toUpperCase();
  }
}

export default function MatchDetailClient({ match, picks, userPick, userId, profiles, totalPickCount }: Props) {
  const [error, setError] = useState('');
  const [currentPick, setCurrentPick] = useState<Pick | null>(userPick);
  const [picking, setPicking] = useState(false);

  const matchStarted = match.status === 'live' || match.status === 'completed';
  const deadlinePassed = isPickDeadlinePassed(match.match_date);
  const drawAllowed = isDrawAllowed(match.stage);

  const team1Picks = picks.filter((p) => p.picked_team === match.team1);
  const team2Picks = picks.filter((p) => p.picked_team === match.team2);
  const drawPicks = picks.filter((p) => p.picked_team === 'DRAW');
  const totalPicks = team1Picks.length + team2Picks.length + drawPicks.length;

  const skippedPlayers = profiles.filter(
    (p) => !picks.some((pick) => pick.user_id === p.id)
  );

  const handlePick = async (team: string) => {
    setError('');
    setPicking(true);
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, picked_team: team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPick(data.pick);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPicking(false);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      const res = await fetch('/api/picks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setCurrentPick(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
        {/* Match header */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Match #{match.match_number}</span>
            <span className={`badge ${match.status === 'live' ? 'badge-error' : match.status === 'completed' ? 'badge-success' : 'badge-muted'}`}>
              {match.status.toUpperCase()}
            </span>
          </div>
          {match.stage !== 'group' && (
            <div className="badge badge-gold" style={{ marginBottom: 8 }}>
              🏆 {getStageName(match.stage)}
            </div>
          )}
          {match.group_letter && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>Group {match.group_letter}</div>
          )}
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.5 }}>
            {formatMatchDate(match.match_date, 'long')} · {getMatchTimeLocal(match.match_date)}<br />
            {match.venue}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: getTeamColor(match.team1) }}>{match.team1}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{getTeamFullName(match.team1)}</div>
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>vs</span>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: getTeamColor(match.team2) }}>{match.team2}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{getTeamFullName(match.team2)}</div>
            </div>
          </div>

          {/* Winner/Draw/NR banner */}
          {match.status === 'completed' && match.winner && (
            <div style={{ marginTop: 16, padding: '0.75rem', borderRadius: 12, background: match.winner === 'NR' ? 'rgba(107,130,153,0.15)' : match.winner === 'DRAW' ? 'var(--color-accent-dim)' : 'var(--color-primary-dim)' }}>
              {match.winner === 'NR' ? (
                <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>☔ Match Abandoned — No Result</span>
              ) : match.winner === 'DRAW' ? (
                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>🤝 Match Drawn</span>
              ) : (
                <span style={{ fontWeight: 700, color: getTeamColor(match.winner) }}>🏆 {getTeamFullName(match.winner)} won</span>
              )}
            </div>
          )}
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {/* Your Pick section - only show when match is live/completed */}
        {currentPick && matchStarted && (
          <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>YOUR PICK</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: currentPick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(currentPick.picked_team) }}>
              {currentPick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(currentPick.picked_team)}
            </div>
            {match.status === 'completed' && match.winner && match.winner !== 'NR' && (
              <div style={{ marginTop: 8 }}>
                {currentPick.picked_team === match.winner ? (
                  <span className="badge badge-success">✅ Correct</span>
                ) : (
                  <span className="badge badge-error">❌ Wrong</span>
                )}
              </div>
            )}
            {match.status === 'completed' && match.winner === 'NR' && (
              <div style={{ marginTop: 8 }}>
                <span className="badge badge-muted">☔ No Result — 0 pts</span>
              </div>
            )}
          </div>
        )}

        {/* PICKS REVEALED (match started) */}
        {matchStarted && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-heading)' }}>📊 Pick Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: getTeamColor(match.team1) }}>{match.team1} {team1Picks.length} ({totalPicks ? Math.round(team1Picks.length / totalPicks * 100) : 0}%)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{totalPicks} picked · {skippedPlayers.length} skipped</span>
              <span style={{ fontWeight: 700, color: getTeamColor(match.team2) }}>{match.team2} {team2Picks.length} ({totalPicks ? Math.round(team2Picks.length / totalPicks * 100) : 0}%)</span>
            </div>
            {drawAllowed && drawPicks.length > 0 && (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 8 }}>
                🤝 Draw {drawPicks.length} ({totalPicks ? Math.round(drawPicks.length / totalPicks * 100) : 0}%)
              </div>
            )}
            {/* Distribution bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              {team1Picks.length > 0 && <div style={{ flex: team1Picks.length, background: getTeamColor(match.team1) }} />}
              {drawPicks.length > 0 && <div style={{ flex: drawPicks.length, background: 'var(--color-accent)' }} />}
              {team2Picks.length > 0 && <div style={{ flex: team2Picks.length, background: getTeamColor(match.team2) }} />}
            </div>

            {/* All picks grid */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '1.5rem 0 1rem', color: 'var(--color-text-heading)' }}>
              👥 All Picks ({totalPicks} of {profiles.length} players)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {picks.map((pick) => {
                const profile = profiles.find((p) => p.id === pick.user_id);
                if (!profile) return null;
                const isNR = match.winner === 'NR';
                const isCorrect = match.winner && !isNR && pick.picked_team === match.winner;
                const isWrong = match.winner && !isNR && pick.picked_team !== match.winner;
                const borderColor = pick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(pick.picked_team);
                return (
                  <div
                    key={pick.id}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 8,
                      border: `2px solid ${borderColor}`,
                      background: isCorrect ? 'var(--color-success-dim)' : isWrong ? 'var(--color-error-dim)' : 'transparent',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    {match.status === 'completed' && !isNR && (
                      <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.65rem' }}>
                        {isCorrect ? '✅' : '❌'}
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-body)' }}>
                      {profile.display_name}
                      {pick.user_id === userId && <span style={{ marginLeft: 4, fontSize: '0.6rem', background: 'var(--color-primary)', color: '#fff', borderRadius: 4, padding: '1px 4px' }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: pick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(pick.picked_team), fontWeight: 600 }}>
                      → {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                    </div>
                  </div>
                );
              })}
              {skippedPlayers.map((p) => (
                <div key={p.id} style={{ padding: '0.5rem', borderRadius: 8, border: '2px solid var(--color-border)', textAlign: 'center', opacity: 0.5, position: 'relative' }}>
                  {match.status === 'completed' && match.winner !== 'NR' && (
                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.65rem' }}>❌</span>
                  )}
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-body)' }}>{p.display_name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Skipped</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PICKS HIDDEN (upcoming) */}
        {match.status === 'upcoming' && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            {!deadlinePassed && !currentPick && (
              <>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', color: 'var(--color-text-heading)' }}>Make Your Pick</h3>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePick(match.team1)}
                    disabled={picking}
                    className="pick-btn"
                    style={{ padding: '12px 24px', borderColor: getTeamColor(match.team1), color: getTeamColor(match.team1), fontSize: '1rem' }}
                  >
                    {match.team1}
                  </button>
                  {drawAllowed && (
                    <button
                      onClick={() => handlePick('DRAW')}
                      disabled={picking}
                      className="pick-btn"
                      style={{ padding: '12px 24px', borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontSize: '1rem' }}
                    >
                      🤝 Draw
                    </button>
                  )}
                  <button
                    onClick={() => handlePick(match.team2)}
                    disabled={picking}
                    className="pick-btn"
                    style={{ padding: '12px 24px', borderColor: getTeamColor(match.team2), color: getTeamColor(match.team2), fontSize: '1rem' }}
                  >
                    {match.team2}
                  </button>
                </div>
              </>
            )}
            {!deadlinePassed && currentPick && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>You picked: <strong style={{ color: currentPick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(currentPick.picked_team) }}>{currentPick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(currentPick.picked_team)}</strong></p>
                <button onClick={handleReset} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Change Pick
                </button>
              </div>
            )}
            {deadlinePassed && (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <p>⏱ Pick deadline has passed</p>
                <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Picks will be revealed when the match starts</p>
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              🔒 {totalPickCount} player{totalPickCount !== 1 ? 's' : ''} picked so far
            </div>
          </div>
        )}
      </div>
    </>
  );
}
