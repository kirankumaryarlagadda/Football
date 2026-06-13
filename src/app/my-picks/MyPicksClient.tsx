'use client';

import Navbar from '@/components/Navbar';
import { Match, Pick, MatchStage } from '@/lib/types';
import { getTeamColor, getTeamFullName } from '@/lib/teams';
import { getMatchPoints, isNoResult } from '@/lib/scoring';
import Link from 'next/link';

interface Props {
  matches: Match[];
  picks: Pick[];
}

export default function MyPicksClient({ matches, picks }: Props) {
  const pickMap = new Map(picks.map((p) => [p.match_id, p]));
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingWithPicks = matches.filter((m) => m.status === 'upcoming' && pickMap.has(m.id));

  const getPickResult = (pick: Pick | undefined, match: Match): 'correct' | 'wrong' | 'missed' | 'nr' => {
    if (match.winner === 'NR') return 'nr';
    if (!pick) return 'missed';
    return pick.picked_team === match.winner ? 'correct' : 'wrong';
  };

  let totalPoints = 0;
  let correct = 0;
  let wrong = 0;
  let missed = 0;

  for (const match of completedMatches) {
    if (isNoResult(match.winner)) continue;
    const pick = pickMap.get(match.id);
    const result = getPickResult(pick, match);
    const pts = getMatchPoints(match.stage as MatchStage);
    if (result === 'correct') { totalPoints += pts.correct; correct++; }
    else if (result === 'wrong') { totalPoints += pts.wrong; wrong++; }
    else if (result === 'missed') { totalPoints += pts.missed; missed++; }
  }

  const totalPicked = picks.length;
  const totalMatches = completedMatches.length + liveMatches.length + upcomingWithPicks.length;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-heading)' }}>
          📋 My Picks
        </h1>

        {/* Summary */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{totalPoints}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Points</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>{correct}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)' }}>{wrong}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Wrong</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{missed}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Missed</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalPicked}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Picked</div>
            </div>
          </div>
        </div>

        {/* Live Picks */}
        {liveMatches.length > 0 && (
          <>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-error)', marginBottom: '0.5rem' }}>🔴 LIVE MATCHES</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {liveMatches.map((match) => {
                const pick = pickMap.get(match.id);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-error)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            #{match.match_number} {match.group_letter ? `· Grp ${match.group_letter}` : `· ${match.stage}`}
                            <span style={{ marginLeft: 8, color: 'var(--color-error)', fontWeight: 600 }}>● LIVE</span>
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                            {getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {pick ? (
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: pick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(pick.picked_team) }}>
                              {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>— Skipped</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Upcoming Picks */}
        {upcomingWithPicks.length > 0 && (
          <>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>📅 UPCOMING PICKS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {upcomingWithPicks.map((match) => {
                const pick = pickMap.get(match.id);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-primary)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            #{match.match_number} {match.group_letter ? `· Grp ${match.group_letter}` : `· ${match.stage}`}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                            {getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {pick && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: pick.picked_team === 'DRAW' ? 'var(--color-accent)' : getTeamColor(pick.picked_team) }}>
                              ✓ {pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Completed Picks */}
        {completedMatches.length > 0 && (
          <>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>✅ COMPLETED</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...completedMatches].reverse().map((match) => {
                const pick = pickMap.get(match.id);
                const result = getPickResult(pick, match);
                const isNR = result === 'nr';
                const stgPts = getMatchPoints(match.stage as MatchStage);
                const points = isNR ? 0 : stgPts[result as keyof typeof stgPts];
                const borderColor = result === 'correct' ? 'var(--color-success)' : result === 'wrong' ? 'var(--color-error)' : 'var(--color-border)';

                return (
                  <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${borderColor}`, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            #{match.match_number} {match.group_letter ? `· Grp ${match.group_letter}` : `· ${match.stage}`}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                            {getTeamFullName(match.team1)} vs {getTeamFullName(match.team2)}
                          </span>
                          {isNR ? (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>☔ No Result</span>
                          ) : match.winner === 'DRAW' ? (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)' }}>🤝 Draw</span>
                          ) : (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: getTeamColor(match.winner!) }}>🏆 {getTeamFullName(match.winner!)}</span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {pick ? (pick.picked_team === 'DRAW' ? '🤝 Draw' : getTeamFullName(pick.picked_team)) : '— Missed'}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: points > 0 ? 'var(--color-success)' : points < 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                            {points > 0 ? `+${points}` : points}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* No picks at all */}
        {totalPicked === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>You haven&apos;t made any picks yet. Go to Matches to start picking!</p>
          </div>
        )}
      </div>
    </>
  );
}
