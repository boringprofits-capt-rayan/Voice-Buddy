import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

     export async function POST(req) {
       const { userId, familyUserId, summary } = await req.json();
       const { error } = await supabase.from('notifications').insert({ user_id: userId, family_user_id: familyUserId, summary });
       if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
       return new Response(JSON.stringify({ message: 'Notification added' }), { status: 200 });
     }

     export async function GET(req) {
       const { searchParams } = new URL(req.url);
       const familyUserId = searchParams.get('familyUserId') || 'family1';
       const { data, error } = await supabase.from('notifications').select('*, family_members!inner(family_name)').eq('family_user_id', familyUserId).order('created_at', { ascending: false });
       if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
       return new Response(JSON.stringify(data), { status: 200 });
     }