import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, guestDb, seedGuestData, seedCheppuData } from '../db';
import { supabase } from '../supabase';

interface DatabaseContextType {
  activeDb: typeof db;
  isGuest: boolean;
  userEmail: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState(() => {
    // If we have a supabase session cookie/token, we might not be a guest
    const role = localStorage.getItem('demo_role');
    return role || 'guest';
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setUserEmail(session.user.email || null);
          setActiveRole('cheppu');
          
          if (session.provider_token) {
             const currentSettings = await db.settings.get(1);
             if (currentSettings) {
                await db.settings.put({
                   ...currentSettings,
                   google_fit_connected: true,
                   google_fit_token: session.provider_token
                });
             }
          }
        } else {
          setUserEmail(null);
          // Only explicit 'guest' if no user
          const savedRole = localStorage.getItem('demo_role');
          setActiveRole(savedRole || 'guest');
        }
      } catch (err) {
        console.error('Context Auth Check Error:', err);
      }
    };
    checkUser();
  }, []);

  const isGuest = activeRole === 'guest';
  const activeDb = isGuest ? guestDb : db;

  useEffect(() => {
    if (isGuest) {
      seedGuestData();
    } else {
      seedCheppuData();
    }
  }, [isGuest]);

  // Cloud Sync Logic
  useEffect(() => {
    if (isGuest) return;

    const syncData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Sync Settings
      const localSettings = await db.settings.get(1);
      if (localSettings) {
        await supabase.from('settings').upsert({
          user_id: user.id,
          height_cm: localSettings.height_cm,
          goal_weight_kg: localSettings.goal_weight_kg,
          age: localSettings.age,
          gender: localSettings.gender,
          fitness_goal: localSettings.fitness_goal,
          activity_level: localSettings.activity_level,
          onboarding_complete: localSettings.onboarding_complete,
          google_fit_connected: localSettings.google_fit_connected,
          google_fit_token: localSettings.google_fit_token,
          google_fit_last_synced_at: localSettings.google_fit_last_synced_at,
          google_fit_write_enabled: localSettings.google_fit_write_enabled,
          google_fit_write_token: localSettings.google_fit_write_token,
          reminders_enabled: localSettings.reminders_enabled,
          reminder_frequency_days: localSettings.reminder_frequency_days
        });
      }

      // 2. Sync Entries
      const localEntries = await db.entries.toArray();
      if (localEntries.length > 0) {
        const payload = localEntries.map(e => ({
          id: e.id,
          user_id: user.id,
          date: e.date,
          weight_kg: e.weight_kg,
          body_fat_pct: e.body_fat_pct,
          notes: e.notes,
          source: e.source || 'manual',
          google_fit_synced: e.google_fit_synced || false,
          created_at: e.created_at
        }));

        const { error } = await supabase.from('entries').upsert(payload, { onConflict: 'id' });
        if (error) console.error('Sync Error:', error);
      }
    };

    // Run sync initially and on interval
    syncData();
    const interval = setInterval(syncData, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, [isGuest, userEmail]);

  return (
    <DatabaseContext.Provider value={{ activeDb, isGuest, userEmail }}>
      {children}
    </DatabaseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
