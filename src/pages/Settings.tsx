import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { Download, Bell, Settings as SettingsIcon, LogOut } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../supabase';

export const Settings: React.FC = () => {
  const { activeDb, isGuest, userEmail } = useDatabase();
  const settings = useLiveQuery(() => activeDb.settings.get(1));

  const [height, setHeight] = useState<string>('');
  const [goal, setGoal] = useState<string>('');

  React.useEffect(() => {
    if (settings) {
      setHeight(settings.height_cm.toString());
      setGoal(settings.goal_weight_kg.toString());
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    if (!height || !goal) return;
    await activeDb.settings.put({
      id: 1,
      height_cm: parseFloat(height),
      goal_weight_kg: parseFloat(goal)
    });
    alert('Profile updated!');
  };

  const exportCsv = async () => {
    const entries = await activeDb.entries.toArray();
    if (!entries.length) return alert('No data to export.');
    
    const csv = Papa.unparse(entries.map(e => ({
      Date: e.date,
      Weight: e.weight_kg,
      BodyFat: e.body_fat_pct,
      Notes: e.notes
    })));
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };




  const handleLogout = async () => {
    if (!isGuest) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('demo_role');
    window.location.reload();
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
      <header className="flex justify-between items-center mt-4 mb-4">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{isGuest ? 'Guest: Sample Profile' : `Log in: ${userEmail}`}</p>
        </div>
      </header>

      <div className="glass-panel text-center mb-6">
        <SettingsIcon size={32} style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
        <h2 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Profile</h2>
        
        <div className="input-group text-left mt-6">
          <label className="input-label">Height (cm)</label>
          <input type="number" className="input-field" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" />
        </div>
        <div className="input-group text-left mt-4">
          <label className="input-label">Goal Weight (kg)</label>
          <input type="number" className="input-field" value={goal} onChange={e => setGoal(e.target.value)} placeholder="70" />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '24px', width: '100%' }} onClick={handleSaveProfile}>
          Save Profile
        </button>
      </div>

      <h3 className="mb-4">Data Management</h3>
      <div className="flex-col gap-4" style={{ display: 'flex' }}>
        <button className="btn btn-secondary justify-between" onClick={exportCsv} style={{ width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> Export CSV</span>
        </button>
      </div>

      <h3 className="mb-4 mt-8">Notifications</h3>
      <div className="glass-panel items-center justify-between flex" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Bell color="var(--accent-primary)" size={24} />
          <div>
            <p style={{ fontWeight: 600 }}>Soft Reminders</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Every 3 days</p>
          </div>
        </div>
        <button className="btn-ghost" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '4px 8px' }}>Edit</button>
      </div>


      <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--glass-border)', marginTop: '32px' }} onClick={handleLogout}>
        <LogOut size={20} /> Log Out
      </button>

    </div>
  );
};
