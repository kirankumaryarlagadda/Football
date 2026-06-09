import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { match_id, picked_team } = await request.json();
  if (!match_id || !picked_team) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Get match details
  const { data: match } = await supabaseAdmin
    .from('fwc_matches')
    .select('*')
    .eq('id', match_id)
    .single();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.status !== 'upcoming') return NextResponse.json({ error: 'Match is no longer upcoming' }, { status: 400 });

  // Check deadline (30 min before)
  const deadline = new Date(new Date(match.match_date).getTime() - 30 * 60 * 1000);
  if (new Date() >= deadline) {
    return NextResponse.json({ error: 'Pick deadline has passed' }, { status: 400 });
  }

  // Validate picked_team
  const validPicks = [match.team1, match.team2];
  if (match.stage === 'group') validPicks.push('DRAW');
  if (!validPicks.includes(picked_team)) {
    return NextResponse.json({ error: 'Invalid pick' }, { status: 400 });
  }

  // Check if pick exists
  const { data: existingPick } = await supabaseAdmin
    .from('fwc_picks')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_id', match_id)
    .single();

  if (existingPick) {
    // Update existing pick
    const { data: updated, error } = await supabaseAdmin
      .from('fwc_picks')
      .update({ picked_team })
      .eq('id', existingPick.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pick: updated });
  } else {
    // Insert new pick
    const { data: inserted, error } = await supabaseAdmin
      .from('fwc_picks')
      .insert({ user_id: user.id, match_id, picked_team })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pick: inserted });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { match_id } = await request.json();

  // Get match details
  const { data: match } = await supabaseAdmin
    .from('fwc_matches')
    .select('*')
    .eq('id', match_id)
    .single();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.status !== 'upcoming') return NextResponse.json({ error: 'Cannot change pick after match started' }, { status: 400 });

  const deadline = new Date(new Date(match.match_date).getTime() - 30 * 60 * 1000);
  if (new Date() >= deadline) {
    return NextResponse.json({ error: 'Pick deadline has passed' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('fwc_picks')
    .delete()
    .eq('user_id', user.id)
    .eq('match_id', match_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
