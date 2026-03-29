import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Measurements } from './pages/Measurements';
import { Progress } from './pages/Progress';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { DatabaseProvider } from './context/DatabaseContext';

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(localStorage.getItem('demo_role'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Checks
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setRole('cheppu');
      } else {
        setRole(localStorage.getItem('demo_role'));
      }
      setLoading(false);
    });

    // 2. Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setRole('cheppu');
      } else {
        setRole(localStorage.getItem('demo_role'));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    localStorage.setItem('demo_role', 'guest');
    setRole('guest');
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh', display: 'flex' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your fitness journey...</p>
      </div>
    );
  }

  // If No Supabase Session AND No Guest Token, Show Login
  if (!session && !role) {
    return <Auth onGuestLogin={handleGuestLogin} />;
  }

  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="measurements" element={<Measurements />} />
            <Route path="progress" element={<Progress />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;
