import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Ruler, TrendingUp, Settings } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      <div className="container" style={{ paddingBottom: '120px' }}>
        <Outlet />
      </div>

      {/* Floating Island Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: '24px',
        right: '24px',
        maxWidth: '400px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(20, 22, 30, 0.8) 0%, rgba(20, 22, 30, 0.6) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), var(--glass-glare)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 24px',
        zIndex: 50
      }}>
        <NavItem to="/" icon={<Home size={24} />} label="Home" />
        <NavItem to="/measurements" icon={<Ruler size={24} />} label="Stats" />
        <NavItem to="/progress" icon={<TrendingUp size={24} />} label="Progress" />
        <NavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
      </nav>
    </>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink 
    to={to}
    end={to === '/'}
    style={({ isActive }) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.6)',
      textDecoration: 'none',
      fontSize: '0.75rem',
      fontWeight: 500,
      transition: 'color var(--transition-fast), transform var(--transition-fast)',
      transform: isActive ? 'scale(1.05)' : 'scale(1)'
    })}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);
