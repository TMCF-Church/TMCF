import React from 'react';
import { Church, ShieldCheck, LogIn, LogOut, HelpCircle, Smartphone, Database } from 'lucide-react';
import { getCustomFirebaseUrl } from '../utils/storage';

export const Header = ({ isPastor, pastorSession, onOpenLogin, onLogout, onOpenDeployment, onOpenFirebase }) => {
  const hasFirebase = Boolean(getCustomFirebaseUrl());

  return (
    <header className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid rgba(245, 158, 11, 0.2)' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Church Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0f172a',
            padding: '0.75rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
          }}>
            <Church size={28} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.2 }} className="gradient-text-gold">
                TMCF Church Reconstruction Fund
              </h1>
              <span className="badge badge-emerald">
                <Smartphone size={12} /> Mobile Ready
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
              The Methodist Church Foundation • Official Collection Ledger & Progress Tracker
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          
          <button 
            className={`btn ${hasFirebase ? 'btn-emerald' : 'btn-secondary'}`}
            onClick={onOpenFirebase}
            title="Connect Cloud DB for Live Multi-Device Sync"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <Database size={16} /> {hasFirebase ? 'Cloud Database Connected' : 'Connect Cloud Sync'}
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={onOpenDeployment}
            title="Deployment Guide"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
          >
            <HelpCircle size={16} /> 24/7 Hosting
          </button>

          {isPastor ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="badge badge-gold" style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
                <ShieldCheck size={16} style={{ color: '#f59e0b' }} />
                <span>Pastor <strong>Pallapati Cornelius</strong></span>
              </div>
              <button 
                className="btn btn-danger" 
                onClick={onLogout}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={onOpenLogin}
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}
            >
              <LogIn size={16} /> Pastor Login
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
