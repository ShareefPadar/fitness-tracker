import React, { useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useLiveQuery } from 'dexie-react-hooks';

export const NotificationManager: React.FC = () => {
  const { activeDb } = useDatabase();
  const settings = useLiveQuery(() => activeDb.settings.get(1), [activeDb]);
  const entries = useLiveQuery(() => activeDb.entries.orderBy('date').reverse().toArray(), [activeDb]);

  useEffect(() => {
    const checkAndNotify = async () => {
      if (!settings?.reminders_enabled) return;
      if (Notification.permission !== 'granted') return;
      
      const lastNotified = localStorage.getItem('last_notification_date');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastNotified === today) return; // Already notified today
      
      let shouldNotify = false;

      if (!entries || entries.length === 0) {
         shouldNotify = true;
      } else {
         const lastEntryDate = new Date(entries[0].date);
         const now = new Date();
         const diffTime = now.getTime() - lastEntryDate.getTime();
         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
         
         const freq = settings.reminder_frequency_days || 3;
         if (diffDays >= freq) {
            shouldNotify = true;
         }
      }

      if (shouldNotify) {
        new Notification("Time to log!", {
          body: "It's been a while since your last entry. Keep your streak going!",
          icon: '/favicon.svg'
        });
        localStorage.setItem('last_notification_date', today);
      }
    };

    // Check after short delay to not interrupt UI rendering
    const timeoutId = setTimeout(checkAndNotify, 3000);
    // Periodically check if tab is left open
    const intervalId = setInterval(checkAndNotify, 1000 * 60 * 60);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [settings, entries]);

  return null;
};
