import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Lock, ArrowRight, UserCircle, Mail } from 'lucide-react';

interface AuthProps {
  onGuestLogin: () => void;
}

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

export const Auth: React.FC<AuthProps> = ({ onGuestLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email first. Check your inbox.');
          } else {
            setError('Incorrect email or password');
          }
        }
      } else if (mode === 'signUp') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            setError('An account with this email already exists. Sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccessMsg('Check your email — tap the link to verify your account');
          setMode('signIn');
        }
      } else if (mode === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMsg('Reset link sent. Check your inbox.');
          setMode('signIn');
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel text-center">
        <h1 className="stat-value" style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>form.</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Track your body stats. No pressure.</p>
        
        <form onSubmit={handleEmailAuth} className="flex-col gap-4" style={{ display: 'flex', textAlign: 'left' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontWeight: 600 }}>Sign in with email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '44px' }}
                placeholder="you@example.com" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setError(''); }} 
                required 
              />
            </div>
          </div>
          
          {mode !== 'forgotPassword' && (
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
          )}

          {mode === 'signUp' && (
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }} 
                  required 
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
            {loading ? 'Processing...' : mode === 'signIn' ? 'Sign in' : mode === 'signUp' ? 'Create account' : 'Send reset link'} <ArrowRight size={18} />
          </button>
          
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
          {successMsg && <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>{successMsg}</p>}
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
          {mode === 'signIn' && (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('forgotPassword')} style={{ background: 'transparent', border: 'none', padding: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Forgot password?</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setMode('signUp'); setError(''); setSuccessMsg(''); }} style={{ background: 'transparent', border: 'none', padding: '8px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>No account yet? Create one</button>
            </>
          )}
          {mode === 'signUp' && (
            <button type="button" className="btn btn-ghost" onClick={() => { setMode('signIn'); setError(''); setSuccessMsg(''); }} style={{ background: 'transparent', border: 'none', padding: '8px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>Already have an account? Sign in</button>
          )}
          {mode === 'forgotPassword' && (
            <button type="button" className="btn btn-ghost" onClick={() => { setMode('signIn'); setError(''); setSuccessMsg(''); }} style={{ background: 'transparent', border: 'none', padding: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Back to sign in</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          <span style={{ padding: '0 16px', fontSize: '0.875rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        </div>

        <button 
          type="button"
          className="btn btn-secondary" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ width: '100%', marginBottom: '16px', background: 'var(--card-bg)', borderColor: 'var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </div>
        </button>

        <button 
          type="button"
          className="btn btn-ghost" 
          style={{ width: '100%', fontSize: '0.875rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: '8px' }}
          onClick={() => {
            window.history.replaceState(null, '', '/');
            onGuestLogin();
          }}
        >
          <UserCircle size={16} style={{ display: 'inline', marginRight: '4px' }} /> Continue as guest (Demo)
        </button>
      </div>
    </div>
  );
};
