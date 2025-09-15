import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

     export async function POST(req) {
       const { userId, subscription, deviceId } = await req.json();
       const { error } = await supabase.from('push_subscriptions').upsert({ user_id: userId, subscription, device_id: deviceId });
       if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
       return new Response(JSON.stringify({ message: 'Subscribed' }), { status: 200 });
     }

     export async function DELETE(req) {
       const { deviceId } = await req.json();
       const { error } = await supabase.from('push_subscriptions').delete().eq('device_id', deviceId);
       if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
       return new Response(JSON.stringify({ message: 'Unsubscribed' }), { status: 200 });
     }