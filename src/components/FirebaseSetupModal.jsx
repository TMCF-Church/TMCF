import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, ExternalLink, Key, AlertCircle } from 'lucide-react';
import { getCustomFirebaseUrl, saveCustomFirebaseUrl } from '../utils/storage';

export const FirebaseSetupModal = ({ isOpen, onClose, onFirebaseSaved }) => {
  const [dbUrl, setDbUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDbUrl(getCustomFirebaseUrl());
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!dbUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your Firebase Database URL.' });
      return;
    }

    const result = saveCustomFirebaseUrl(dbUrl);
    if (result) {
      setStatusMsg({ type: 'success', text: 'Firebase Database URL connected! Live multi-device sync is active.' });
      if (onFirebaseSaved) onFirebaseSaved();
      setTimeout(() => onClose(), 1500);
    } else {
      setStatusMsg({ type: 'error', text: 'Could not save Firebase URL.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', pb: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)' }}>
              <Database size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }} className="gradient-text-gold">
                Connect Free Cloud Database (Live Sync)
              </h2>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Real-time synchronization across mobile phones & laptops</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {statusMsg && (
          <div style={{ 
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, 
            color: statusMsg.type === 'success' ? 'var(--accent-emerald-light)' : '#f87171', 
            padding: '0.7rem 0.9rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          
          <div className="form-group">
            <label className="form-label">Firebase Realtime Database URL</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="https://tmcf-church-default-rtdb.firebaseio.com"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Paste your free Firebase Realtime Database URL here to sync mobile and laptop changes instantly in 0.1s.
            </span>
          </div>

          {/* Quick Setup Instructions */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExternalLink size={14} /> How to get your FREE Firebase Database URL in 2 minutes:
            </h4>
            <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>console.firebase.google.com</a> (Free with any Google account).</li>
              <li>Click <strong>Create Project</strong> → name it <code>TMCF-Church</code> → click <strong>Build</strong> → <strong>Realtime Database</strong>.</li>
              <li>Click <strong>Create Database</strong> → select <strong>Start in Test Mode</strong> (allows read & write).</li>
              <li>Copy the database URL (e.g. <code>https://your-app-default-rtdb.firebaseio.com</code>) and paste it above!</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Database size={16} /> Save & Connect Database
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
