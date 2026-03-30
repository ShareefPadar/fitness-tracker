import React, { useState } from 'react';
import { supabase } from '../supabase';
import { User, Lock, ArrowRight, UserCircle } from 'lucide-react';

interface AuthProps {
  onGuestLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onGuestLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.history.replaceState(null, '', '/');
    }
    setLoading(false);
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel text-center">
        <h1 className="stat-value" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Roomy Fit</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Personal fitness tracker.</p>
        
        <form onSubmit={handleSupabaseLogin} className="flex-col gap-4" style={{ display: 'flex', textAlign: 'left' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Private Login (Email)</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '44px' }}
                placeholder="email@example.com" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setError(''); }} 
                required 
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </button>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          <span style={{ padding: '0 16px', fontSize: '0.875rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        </div>

        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', borderColor: 'var(--glass-border)' }}
          onClick={() => {
            window.history.replaceState(null, '', '/');
            onGuestLogin();
          }}
        >
          <UserCircle size={18} /> View Demo
        </button>
        <p style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Explore a fully populated sample account. Any changes made will not be saved permanently.
        </p>
      </div>
    </div>
  );
};
