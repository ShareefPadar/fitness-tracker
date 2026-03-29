import Dexie, { type EntityTable } from 'dexie';

export interface Entry {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  weight_kg: number;
  body_fat_pct?: number; // optional
  notes?: string;
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
export const guestDb = new Dexie('FitnessTrackerDB_Guest') as Dexie & {
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
      { id: 's1', date: '2024-03-01', weight_kg: 82.5, body_fat_pct: 22.1, notes: 'Starting journey', created_at: Date.now() },
      { id: 's2', date: '2024-03-05', weight_kg: 81.8, body_fat_pct: 21.8, created_at: Date.now() },
      { id: 's3', date: '2024-03-12', weight_kg: 81.2, body_fat_pct: 21.5, notes: 'Feeling lighter', created_at: Date.now() },
      { id: 's4', date: '2024-03-18', weight_kg: 80.5, body_fat_pct: 21.2, created_at: Date.now() },
      { id: 's5', date: '2024-03-24', weight_kg: 79.8, body_fat_pct: 20.9, notes: 'Consistent work pays off', created_at: Date.now() },
    ];

    const sampleMeasures: Measurement[] = [
      { id: 'm1', date: '2024-03-01', waist_cm: 94, chest_cm: 102, hips_cm: 105, arms_cm: 34 },
      { id: 'm2', date: '2024-03-24', waist_cm: 91, chest_cm: 101, hips_cm: 103, arms_cm: 35 },
    ];

    await guestDb.entries.bulkPut(sampleEntries);
    await guestDb.measurements.bulkPut(sampleMeasures);
    await guestDb.settings.put({ id: 1, height_cm: 168, goal_weight_kg: 65 });
  } catch (err) {
    console.error('Guest Seeding Error:', err);
  }
};

export const seedCheppuData = async () => {
  try {
    const count = await db.entries.count();
    // Always ensure settings are there
    await db.settings.put({ id: 1, height_cm: 168, goal_weight_kg: 65 });

    // Only import if database is empty to prevent duplicates
    if (count > 0) return;
    
    const { cheppuSeedData } = await import('./cheppuSeedData');
    await db.entries.bulkPut(cheppuSeedData);
  } catch (err) {
    console.error('Cheppu Seeding Error:', err);
  }
};
