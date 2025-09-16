'use client';

     import { useState, useEffect } from 'react';
     import { useSearchParams } from 'next/navigation';
     import { v4 as uuidv4 } from 'uuid';
     import Cookies from 'js-cookie';
     import { Suspense } from 'react';

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

       // Rest of the code remains the same...

       // (Paste the full Home function content here from the previous artifact, but wrap it in HomeContent)

       return (
         <div style={{ padding: '20px', fontFamily: 'Arial', fontSize: '24px', textAlign: 'center' }}>
           {/* Dashboard content */}
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