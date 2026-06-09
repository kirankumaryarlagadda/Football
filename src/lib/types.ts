export interface Team {
  id: string;
  name: string;
  short_name: string;
  color: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type MatchStage = 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'bronze' | 'final';

export interface Match {
  id: string;
  match_number: number;
  team1: string;
  team2: string;
  group_letter: string | null; // A-L for group stage, null for knockout
  venue: string;
  match_date: string; // ISO 8601 string (stored as TIMESTAMPTZ in DB)
  status: MatchStatus;
  winner: string | null; // team abbr, 'DRAW', or 'NR'
  stage: MatchStage;
  created_at: string;
}

export function getMatchTimeLocal(matchDate: string): string {
  const d = new Date(matchDate);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatMatchDate(matchDate: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(matchDate);
  if (style === 'long') {
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

export interface Pick {
  id: string;
  user_id: string;
  match_id: string;
  picked_team: string; // team abbr or 'DRAW'
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  correct_picks: number;
  wrong_picks: number;
  missed_picks: number;
  total_points: number;
  rank: number;
  current_streak: number;
  longest_streak: number;
}
