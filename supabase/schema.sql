-- FWC Picks 2026 — Database Schema
-- Uses same Supabase project as IPL Picks
-- Shares: profiles table (same users/auth)
-- New: fwc_matches, fwc_picks tables

-- ============================================
-- FWC MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fwc_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_number INTEGER UNIQUE NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  group_letter TEXT, -- 'A' through 'L' for group stage, NULL for knockout
  venue TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  winner TEXT, -- team abbreviation, 'DRAW', or 'NR'
  stage TEXT NOT NULL DEFAULT 'group' CHECK (stage IN ('group', 'round32', 'round16', 'quarter', 'semi', 'bronze', 'final')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FWC PICKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fwc_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES fwc_matches(id) ON DELETE CASCADE,
  picked_team TEXT NOT NULL, -- team abbreviation or 'DRAW'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fwc_matches_status ON fwc_matches(status);
CREATE INDEX IF NOT EXISTS idx_fwc_matches_match_number ON fwc_matches(match_number);
CREATE INDEX IF NOT EXISTS idx_fwc_picks_user_id ON fwc_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_fwc_picks_match_id ON fwc_picks(match_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE fwc_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fwc_picks ENABLE ROW LEVEL SECURITY;

-- FWC Matches: All authenticated users can read
CREATE POLICY "fwc_matches_select_all"
  ON fwc_matches FOR SELECT
  TO authenticated
  USING (true);

-- FWC Picks: Users can see their own picks OR picks for matches that aren't upcoming
CREATE POLICY "fwc_picks_select_own_or_revealed"
  ON fwc_picks FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM fwc_matches
      WHERE fwc_matches.id = fwc_picks.match_id
        AND fwc_matches.status != 'upcoming'
    )
  );

-- FWC Picks: Users can insert their own picks
CREATE POLICY "fwc_picks_insert_own"
  ON fwc_picks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Note: UPDATE and DELETE done via service_role (admin) to bypass RLS
