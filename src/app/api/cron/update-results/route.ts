import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST() {
  // Auto-promote upcoming to live
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('fwc_matches')
    .update({ status: 'live' })
    .eq('status', 'upcoming')
    .lte('match_date', now);

  return NextResponse.json({ message: 'Status updated. Use admin panel to set winners manually.' });
}
