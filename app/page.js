'use client';

     import { useState, useEffect } from 'react';
     import { useSearchParams } from 'next/navigation';
     import { v4 as uuidv4 } from 'uuid';
     import Cookies from 'js-cookie';
     import { Suspense } from 'react';

     export const dynamic = 'force-dynamic'; // Forces dynamic rendering to avoid prerender error

     function HomeContent() {
       const [schedules, setSchedules] = useState([]);
       const [notifications, setNotifications] = useState([]);
       const [isListening, setIsListening] = useState(false);
       const [transcript, setTranscript] = useState('');
       const [language, setLanguage] = useState('en-US');
       const [view, setView] = useState('senior');
       const [userId, setUserId] = useState('user1');
       const [familyUserId, setFamilyUserId] = useState('family1');
       const [isSubscribed, setIsSubscribed] = useState(false);
       const [deviceId, setDeviceId] = useState(null);

       const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
       const recognition = typeof window !== 'undefined' ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;
       const searchParams = useSearchParams();

       useEffect(() => {
         if ('serviceWorker' in navigator && 'PushManager' in window) {
           navigator.serviceWorker.register('/sw.js').then(() => console.log('Service Worker registered'));
           let id = Cookies.get('deviceId');
           if (!id) {
             id = uuidv4();
             Cookies.set('deviceId', id, { expires: 365 });
           }
           setDeviceId(id);
           fetch(`/api/subscribe?deviceId=${id}`).then(res => res.json()).then(data => setIsSubscribed(!!data.subscribed));
         }
       }, []);

       useEffect(() => {
         if (view === 'senior') {
           fetch(`/api/schedules?userId=${userId}`)
             .then(res => res.json())
             .then(data => {
               setSchedules(data);
               if (data.length > 0) {
                 const now = new Date();
                 const dueReminders = data.filter(s => new Date(s.time) <= now);
                 if (dueReminders.length > 0) {
                   const reminderText = dueReminders.map(s => `Reminder: ${s.event} at ${s.time}`).join('. ');
                   speak(`Hello! You have due reminders: ${reminderText}`);
                 }
               }
               if (searchParams.get('checkin') === 'true') {
                 startVoiceInteraction(true);
               }
             });
         } else {
           fetch(`/api/notifications?familyUserId=${familyUserId}`)
             .then(res => res.json())
             .then(data => setNotifications(data));
         }
       }, [view, userId, familyUserId, searchParams]);

       const speak = (text, lang = language) => {
         if (synth) {
           const utterance = new SpeechSynthesisUtterance(text);
           utterance.lang = lang;
           synth.speak(utterance);
         }
       };

       const subscribeToPush = async () => {
         const registration = await navigator.serviceWorker.ready;
         const subscription = await registration.pushManager.subscribe({
           userVisibleOnly: true,
           applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
         });
         await fetch('/api/subscribe', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userId, subscription, deviceId }),
         });
         setIsSubscribed(true);
       };

       const unsubscribeFromPush = async () => {
         await fetch('/api/subscribe', {
           method: 'DELETE',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ deviceId }),
         });
         setIsSubscribed(false);
       };

       const startVoiceInteraction = (isCheckIn = false) => {
         if (view !== 'senior') {
           speak('Voice interaction is only available in Senior View.');
           return;
         }

         let greeting = 'Hello! This is Voice Buddy. No reminders yet. Say something like, remind me about an event, to add a schedule.';
         if (schedules.length > 0) {
           const reminderText = schedules.map(s => `Reminder: ${s.event} at ${s.time}`).join('. ');
           greeting = `Hello! This is Voice Buddy. Here are your reminders: ${reminderText}. Say something like, remind me about an event, to add a schedule.`;
         }
         if (isCheckIn) {
           greeting = 'Hello! Time for your check-in. How’s your day going? Let’s chat.';
         }
         speak(greeting);

         if (recognition) {
           recognition.lang = language;
           recognition.start();
           setIsListening(true);

           recognition.onresult = async (event) => {
             const text = event.results[0][0].transcript;
             setTranscript(text);
             setIsListening(false);
             recognition.stop();

             if (text.toLowerCase().includes('help')) {
               speak('I’m sorry to hear that. I’ll notify your family member. Please seek appropriate attention.');
               await fetch('/api/notifications', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId, familyUserId, summary: 'User requested help.' }),
               });
               return;
             }

             if (text.toLowerCase().includes('remind me')) {
               const eventMatch = text.match(/about (.*) at/);
               const timeMatch = text.match(/at (.*)/);
               if (eventMatch && timeMatch) {
                 const event = eventMatch[1];
                 const time = timeMatch[1];
                 speak(`Got it! I’ll remind you about ${event} at ${time}.`);
                 await fetch('/api/schedule', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ userId, event, time }),
                 });
                 await fetch('/api/notifications', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ userId, familyUserId, summary: `User added a reminder: ${event} at ${time}.` }),
                 });
                 const res = await fetch(`/api/schedules?userId=${userId}`);
                 setSchedules(await res.json());
               } else {
                 speak('Please say, remind me about an event at a specific time.');
               }
             } else {
               speak('Let’s talk about something fun! What’s your favorite hobby?');
               await fetch('/api/notifications', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId, familyUserId, summary: `User spoke about: ${text}.` }),
               });
             }
           };

           recognition.onend = () => {
             setIsListening(false);
           };
         }
       };

       return (
         <div style={{ padding: '20px', fontFamily: 'Arial', fontSize: '24px', textAlign: 'center' }}>
           <h1>Voice Buddy Dashboard</h1>
           <div style={{ marginBottom: '20px' }}>
             <button
               onClick={() => setView('senior')}
               style={{
                 padding: '10px',
                 fontSize: '18px',
                 backgroundColor: view === 'senior' ? '#4CAF50' : '#ccc',
                 color: 'white',
                 border: 'none',
                 borderRadius: '5px',
                 marginRight: '10px',
               }}
             >
               Senior View
             </button>
             <button
               onClick={() => setView('family')}
               style={{
                 padding: '10px',
                 fontSize: '18px',
                 backgroundColor: view === 'family' ? '#4CAF50' : '#ccc',
                 color: 'white',
                 border: 'none',
                 borderRadius: '5px',
               }}
             >
               Family View
             </button>
           </div>

           {view === 'senior' ? (
             <>
               <p>Welcome! Select your language and click below to interact with Voice Buddy.</p>
               <select
                 value={language}
                 onChange={(e) => setLanguage(e.target.value)}
                 style={{ padding: '10px', fontSize: '18px', marginBottom: '10px' }}
               >
                 <option value="en-US">English (US)</option>
                 <option value="es-ES">Spanish</option>
                 <option value="zh-CN">Mandarin</option>
                 <option value="fr-FR">French</option>
                 <option value="hi-IN">Hindi</option>
               </select>
               <br />
               <button
                 onClick={startVoiceInteraction}
                 disabled={isListening}
                 style={{
                   padding: '10px 20px',
                   fontSize: '18px',
                   backgroundColor: isListening ? '#ccc' : '#4CAF50',
                   color: 'white',
                   border: 'none',
                   borderRadius: '5px',
                   cursor: isListening ? 'not-allowed' : 'pointer',
                 }}
               >
                 {isListening ? 'Listening...' : 'Talk to Voice Buddy'}
               </button>
               <div style={{ marginTop: '20px' }}>
                 <h2>Your Schedules</h2>
                 <ul>
                   {schedules.map((schedule, index) => (
                     <li key={index}>{schedule.event} at {schedule.time}</li>
                   ))}
                 </ul>
               </div>
               <p>Last heard: {transcript}</p>
               <div style={{ marginTop: '20px' }}>
                 <button
                   onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                   style={{
                     padding: '10px',
                     fontSize: '18px',
                     backgroundColor: '#2196F3',
                     color: 'white',
                     border: 'none',
                     borderRadius: '5px',
                   }}
                 >
                   {isSubscribed ? 'Unsubscribe from Check-Ins' : 'Subscribe to Daily Check-Ins'}
                 </button>
               </div>
             </>
           ) : (
             <>
               <p>Family View: Notifications for {familyUserId}</p>
               <h2>Notifications</h2>
               <ul>
                 {notifications.map((notification, index) => (
                   <li key={index}>
                     {notification.created_at}: {notification.summary} (From: {notification.family_name})
                   </li>
                 ))}
               </ul>
             </>
           )}
         </div>
       );
     }

     export default function Home() {
       return (
         <Suspense fallback={<div>Loading...</div>}>
           <HomeContent />
         </Suspense>
       );
     }