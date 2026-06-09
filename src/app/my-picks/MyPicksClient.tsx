'use client';

import Navbar from '@/components/Navbar';
import { Match, Pick, MatchStage } from '@/lib/types';
import { getTeamColor } from '@/lib/teams';
import { getMatchPoints, isNoResult } from '@/lib/scoring';

interface Props {
  matches: Match[];
  picks: Pick[];
}

export default function MyPicksClient({ matches, picks }: Props) {
  const pickMap = new Map(picks.map((p) => [p.match_id, p]));
  const completedMatches = matches.filter((m) => m.status === 'completed');

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

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: '#1a202c' }}>
          📋 My Picks
        </h1>

        {/* Summary */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPoints >= 0 ? '#48bb78' : '#f56565' }}>{totalPoints}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Points</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#48bb78' }}>{correct}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f56565' }}>{wrong}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Wrong</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a0aec0' }}>{missed}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Missed</div>
            </div>
          </div>
        </div>

        {/* Picks list */}
        {completedMatches.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#a0aec0' }}>No completed matches yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...completedMatches].reverse().map((match) => {
              const pick = pickMap.get(match.id);
              const result = getPickResult(pick, match);
              const isNR = result === 'nr';
              const stgPts = getMatchPoints(match.stage as MatchStage);
              const points = isNR ? 0 : stgPts[result as keyof typeof stgPts];
              const bgColor = result === 'correct' ? 'rgba(72,187,120,0.05)' : result === 'wrong' ? 'rgba(245,101,101,0.05)' : 'rgba(160,174,192,0.05)';

              return (
                <div key={match.id} className="card" style={{ padding: '0.75rem 1rem', background: bgColor }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#a0aec0' }}>#{match.match_number} {match.group_letter ? `· Grp ${match.group_letter}` : `· ${match.stage}`}</div>
                      <span style={{ fontWeight: 600 }}>{match.team1} vs {match.team2}</span>
                      {isNR ? (
                        <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#a0aec0' }}>☔ No Result</span>
                      ) : match.winner === 'DRAW' ? (
                        <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#b7791f' }}>🤝 Draw</span>
                      ) : (
                        <span style={{ marginLeft: 8, fontSize: '0.75rem', color: getTeamColor(match.winner!) }}>🏆 {match.winner}</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                        Picked: {pick ? (pick.picked_team === 'DRAW' ? '🤝 Draw' : pick.picked_team) : '—'}
                      </div>
                      <div style={{ fontWeight: 700, color: points > 0 ? '#48bb78' : points < 0 ? '#f56565' : '#a0aec0' }}>
                        {points > 0 ? `+${points}` : points}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
