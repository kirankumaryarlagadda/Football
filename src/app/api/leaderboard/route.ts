import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { getMatchPoints, isNoResult } from '@/lib/scoring';
import { MatchStage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all approved profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name')
    .eq('is_approved', true);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // Get completed matches
  const { data: matches } = await supabaseAdmin
    .from('fwc_matches')
    .select('id, status, winner, stage, match_number')
    .eq('status', 'completed')
    .order('match_number', { ascending: true });

  if (!matches || matches.length === 0) {
    // No completed matches yet — still show all players with 0 points
    const ranked = profiles.map((profile, index) => ({
      user_id: profile.id,
      display_name: profile.display_name,
      total_points: 0,
      correct_picks: 0,
      wrong_picks: 0,
      missed_picks: 0,
      current_streak: 0,
      longest_streak: 0,
      rank: index + 1,
    }));
    return NextResponse.json({ leaderboard: ranked });
  }

  // Get all picks for completed matches
  const matchIds = matches.map((m) => m.id);
  const { data: allPicks } = await supabaseAdmin
    .from('fwc_picks')
    .select('user_id, match_id, picked_team')
    .in('match_id', matchIds);

  // Calculate scores for each player
  const leaderboard = profiles.map((profile) => {
    const userPicks = (allPicks || []).filter((p) => p.user_id === profile.id);
    const pickMap = new Map(userPicks.map((p) => [p.match_id, p.picked_team]));

    let totalPoints = 0;
    let correctPicks = 0;
    let wrongPicks = 0;
    let missedPicks = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    for (const match of matches) {
      if (isNoResult(match.winner)) continue;

      const points = getMatchPoints(match.stage as MatchStage);
      const picked = pickMap.get(match.id);

      if (!picked) {
        missedPicks++;
        totalPoints += points.missed;
        currentStreak = 0;
      } else if (picked === match.winner) {
        correctPicks++;
        totalPoints += points.correct;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        wrongPicks++;
        totalPoints += points.wrong;
        currentStreak = 0;
      }
    }

    return {
      user_id: profile.id,
      display_name: profile.display_name,
      total_points: totalPoints,
      correct_picks: correctPicks,
      wrong_picks: wrongPicks,
      missed_picks: missedPicks,
      current_streak: currentStreak,
      longest_streak: longestStreak,
    };
  });

  // Sort: points desc, correct desc, longest streak desc, wrong asc, missed asc
  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.correct_picks !== a.correct_picks) return b.correct_picks - a.correct_picks;
    if (b.longest_streak !== a.longest_streak) return b.longest_streak - a.longest_streak;
    if (a.wrong_picks !== b.wrong_picks) return a.wrong_picks - b.wrong_picks;
    return a.missed_picks - b.missed_picks;
  });

  // Assign ranks
  const ranked = leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  return NextResponse.json({ leaderboard: ranked });
}
