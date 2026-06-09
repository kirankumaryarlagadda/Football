import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, user_id } = await request.json();

  if (action === 'approve') {
    const { error } = await supabaseAdmin.from('profiles').update({ is_approved: true }).eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    await supabaseAdmin.from('profiles').delete().eq('id', user_id);
    await supabaseAdmin.auth.admin.deleteUser(user_id);
    return NextResponse.json({ success: true });
  }

  if (action === 'reset-password') {
    const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 8) + '!';
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: tempPassword,
      user_metadata: { force_password_reset: true },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('email').eq('id', user_id).single();
    return NextResponse.json({ success: true, temp_password: tempPassword, email: targetProfile?.email });
  }

  if (action === 'make-admin') {
    const { error } = await supabaseAdmin.from('profiles').update({ is_admin: true }).eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'remove-admin') {
    const { error } = await supabaseAdmin.from('profiles').update({ is_admin: false }).eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'remove') {
    await supabaseAdmin.from('fwc_picks').delete().eq('user_id', user_id);
    await supabaseAdmin.from('profiles').delete().eq('id', user_id);
    await supabaseAdmin.auth.admin.deleteUser(user_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
