import { MatchStage } from './types';

interface StagePoints {
  correct: number;
  wrong: number;
  missed: number;
}

export function getMatchPoints(stage: MatchStage): StagePoints {
  switch (stage) {
    case 'group':
      return { correct: 5, wrong: -3, missed: -3 };
    case 'round32':
      return { correct: 8, wrong: -4, missed: -4 };
    case 'round16':
      return { correct: 10, wrong: -5, missed: -5 };
    case 'quarter':
      return { correct: 12, wrong: -6, missed: -6 };
    case 'semi':
    case 'bronze':
      return { correct: 15, wrong: -8, missed: -8 };
    case 'final':
      return { correct: 20, wrong: -12, missed: -12 };
    default:
      return { correct: 5, wrong: -3, missed: -3 };
  }
}

export function getScoringTable(): { stage: string; correct: number; wrong: number; missed: number }[] {
  return [
    { stage: 'Group Stage', correct: 5, wrong: -3, missed: -3 },
    { stage: 'Round of 32', correct: 8, wrong: -4, missed: -4 },
    { stage: 'Round of 16', correct: 10, wrong: -5, missed: -5 },
    { stage: 'Quarter-Final', correct: 12, wrong: -6, missed: -6 },
    { stage: 'Semi-Final', correct: 15, wrong: -8, missed: -8 },
    { stage: 'Bronze Final', correct: 15, wrong: -8, missed: -8 },
    { stage: 'Final', correct: 20, wrong: -12, missed: -12 },
  ];
}

export function isNoResult(winner: string | null): boolean {
  return winner === 'NR';
}

export function isDraw(winner: string | null): boolean {
  return winner === 'DRAW';
}

export function calculateScore(
  picks: { match_id: string; picked_team: string }[],
  matches: { id: string; status: string; winner: string | null; stage: MatchStage }[]
): {
  totalPoints: number;
  correctPicks: number;
  wrongPicks: number;
  missedPicks: number;
} {
  let totalPoints = 0;
  let correctPicks = 0;
  let wrongPicks = 0;
  let missedPicks = 0;

  const picksByMatchId = new Map<string, string>();
  for (const pick of picks) {
    picksByMatchId.set(pick.match_id, pick.picked_team);
  }

  const completedMatches = matches.filter((m) => m.status === 'completed');

  for (const match of completedMatches) {
    if (isNoResult(match.winner)) continue;

    const points = getMatchPoints(match.stage);
    const pickedTeam = picksByMatchId.get(match.id);

    if (!pickedTeam) {
      missedPicks++;
      totalPoints += points.missed;
    } else if (pickedTeam === match.winner) {
      // pickedTeam can be 'DRAW' and match.winner can be 'DRAW' — they match
      correctPicks++;
      totalPoints += points.correct;
    } else {
      wrongPicks++;
      totalPoints += points.wrong;
    }
  }

  return { totalPoints, correctPicks, wrongPicks, missedPicks };
}
