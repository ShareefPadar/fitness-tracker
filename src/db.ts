import Dexie, { type EntityTable } from 'dexie';

export interface Entry {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  weight_kg: number;
  body_fat_pct?: number; // optional
  notes?: string;
  source?: string; // 'manual', 'google_fit', 'csv_import'
  google_fit_synced?: boolean;
  created_at: number; // timestamp
}

export interface Measurement {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  waist_cm?: number;
  chest_cm?: number;
  hips_cm?: number;
  arms_cm?: number;
}

export interface Settings {
  id: number; // Always 1
  height_cm: number;
  goal_weight_kg: number;
  age?: number;
  gender?: 'Male' | 'Female';
  fitness_goal?: 'Fat Loss' | 'Muscle Gain' | 'Maintain';
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  onboarding_complete?: boolean;
  google_fit_connected?: boolean;
  google_fit_token?: string;
  google_fit_last_synced_at?: string;
  google_fit_write_enabled?: boolean;
  google_fit_write_token?: string;
  reminders_enabled?: boolean;
  reminder_frequency_days?: number;
}

// Main Production DB for 'Cheppu'
export const db = new Dexie('FitnessTrackerDB_Main') as Dexie & {
  entries: EntityTable<Entry, 'id'>;
  measurements: EntityTable<Measurement, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(2).stores({
  entries: 'id, date, created_at',
  measurements: 'id, date',
  settings: 'id'
});

// Demo/Guest DB
export const guestDb = new Dexie('FitnessTrackerDB_Guest_v3') as Dexie & {
  entries: EntityTable<Entry, 'id'>;
  measurements: EntityTable<Measurement, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

guestDb.version(2).stores({
  entries: 'id, date, created_at',
  measurements: 'id, date',
  settings: 'id'
});

// Helper to seed guest data if empty
export const seedGuestData = async () => {
  try {
    const count = await guestDb.entries.count();
    if (count > 0) return;

    const sampleEntries: Entry[] = [
      { id: 's1', date: '2025-04-01', weight_kg: 92.0, notes: 'Starting the transformation journey. Hoping for the best this time.', created_at: Date.now() },
      { id: 's2', date: '2025-04-15', weight_kg: 91.1, created_at: Date.now() },
      { id: 's3', date: '2025-05-01', weight_kg: 90.0, notes: 'First month done. Losing some water weight early on.', created_at: Date.now() },
      { id: 's4', date: '2025-05-15', weight_kg: 89.2, created_at: Date.now() },
      { id: 's5', date: '2025-06-01', weight_kg: 88.5, created_at: Date.now() },
      { id: 's6', date: '2025-06-15', weight_kg: 87.8, notes: 'Feeling the momentum. Clothes fit better.', created_at: Date.now() },
      { id: 's7', date: '2025-07-01', weight_kg: 87.2, created_at: Date.now() },
      { id: 's8', date: '2025-07-20', weight_kg: 86.8, notes: 'Summer vacation. Trying to maintain rather than lose.', created_at: Date.now() },
      { id: 's9', date: '2025-08-05', weight_kg: 86.9, created_at: Date.now() },
      { id: 's10', date: '2025-08-25', weight_kg: 86.3, created_at: Date.now() },
      { id: 's11', date: '2025-09-10', weight_kg: 85.8, notes: 'Getting back into the routine.', created_at: Date.now() },
      { id: 's12', date: '2025-09-28', weight_kg: 85.5, created_at: Date.now() },
      { id: 's13', date: '2025-10-12', weight_kg: 85.6, created_at: Date.now() },
      { id: 's14', date: '2025-10-25', weight_kg: 85.2, notes: 'A bit of a plateau, but staying consistent.', created_at: Date.now() },
      { id: 's15', date: '2025-11-08', weight_kg: 84.8, created_at: Date.now() },
      { id: 's16', date: '2025-11-20', weight_kg: 84.4, created_at: Date.now() },
      { id: 's17', date: '2025-12-05', weight_kg: 84.1, created_at: Date.now() },
      { id: 's18', date: '2025-12-28', weight_kg: 83.8, notes: 'Survived the holidays without gaining! Proud of this.', created_at: Date.now() },
      { id: 's19', date: '2026-01-05', weight_kg: 83.2, created_at: Date.now() },
      { id: 's20', date: '2026-01-18', weight_kg: 82.5, notes: 'New Year energy kicking in.', created_at: Date.now() },
      { id: 's21', date: '2026-02-02', weight_kg: 81.8, created_at: Date.now() },
      { id: 's22', date: '2026-02-15', weight_kg: 81.3, created_at: Date.now() },
      { id: 's23', date: '2026-02-28', weight_kg: 80.9, notes: 'Solid consistent progress all month.', created_at: Date.now() },
      { id: 's24', date: '2026-03-08', weight_kg: 80.6, created_at: Date.now() },
      { id: 's25', date: '2026-03-18', weight_kg: 80.3, created_at: Date.now() },
      { id: 's26', date: '2026-03-29', weight_kg: 80.0, notes: 'Pacing myself perfectly for the long term.', created_at: Date.now() },
    ];

    const sampleMeasures: Measurement[] = [
      { id: 'm1', date: '2025-04-01', waist_cm: 105, chest_cm: 110, hips_cm: 112, arms_cm: 32 },
      { id: 'm2', date: '2025-06-01', waist_cm: 101, chest_cm: 108, hips_cm: 109, arms_cm: 33 },
      { id: 'm3', date: '2025-08-01', waist_cm: 99, chest_cm: 106, hips_cm: 107, arms_cm: 33 },
      { id: 'm4', date: '2025-10-01', waist_cm: 97, chest_cm: 104, hips_cm: 105, arms_cm: 34 },
      { id: 'm5', date: '2025-12-01', waist_cm: 95, chest_cm: 102, hips_cm: 104, arms_cm: 34 },
      { id: 'm6', date: '2026-03-01', waist_cm: 92, chest_cm: 100, hips_cm: 101, arms_cm: 35 },
    ];

    await guestDb.entries.bulkPut(sampleEntries);
    await guestDb.measurements.bulkPut(sampleMeasures);
    await guestDb.settings.put({ id: 1, height_cm: 180, goal_weight_kg: 72, age: 28, gender: 'Male', fitness_goal: 'Fat Loss', activity_level: 'moderately_active', reminders_enabled: false, reminder_frequency_days: 3 });
  } catch (err) {
    console.error('Guest Seeding Error:', err);
  }
};

export const seedCheppuData = async () => {
  try {
    const count = await db.entries.count();
    // Always ensure settings are there
    await db.settings.put({ id: 1, height_cm: 168, goal_weight_kg: 65, age: 25, gender: 'Male', fitness_goal: 'Muscle Gain', activity_level: 'moderately_active', reminders_enabled: false, reminder_frequency_days: 3 });

    // Only import if database is empty to prevent duplicates
    if (count > 0) return;
    
    const { cheppuSeedData } = await import('./cheppuSeedData');
    await db.entries.bulkPut(cheppuSeedData);
  } catch (err) {
    console.error('Cheppu Seeding Error:', err);
  }
};
