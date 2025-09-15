import webpush from 'web-push';
     import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

     export async function GET() {
       webpush.setVapidDetails(
         process.env.NEXT_PUBLIC_VAPID_SUBJECT,
         process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
         process.env.VAPID_PRIVATE_KEY
       );
       const { data, error } = await supabase.from('push_subscriptions').select('user_id, subscription');
       if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
       for (const row of data) {
         try {
           await webpush.sendNotification(row.subscription, JSON.stringify({
             title: 'Voice Buddy Check-In',
             body: 'Time for your daily check-in! Open to chat.',
             url: '/?checkin=true'
           }));
         } catch (error) {
           console.error('Push failed:', error);
         }
       }
       return new Response('Cron executed', { status: 200 });
     }