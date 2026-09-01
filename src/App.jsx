import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { ExportBar } from './components/ExportBar';
import { RecordList } from './components/RecordList';
import { RecordFormModal } from './components/RecordFormModal';
import { LoginModal } from './components/LoginModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { DeploymentModal } from './components/DeploymentModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';

import { 
  getStoredRecords, 
  fetchFromCloudDB,
  addRecord, 
  updateRecord, 
  deleteRecord, 
  resetRecordsToDefaults 
} from './utils/storage';

import { 
  checkIsPastorLoggedIn, 
  getPastorSession, 
  logoutPastor 
} from './utils/auth';

import { RefreshCw, Church, Heart, Shield } from 'lucide-react';

export function App() {
  // Main Data States
  const [records, setRecords] = useState([]);

  // Authentication State
  const [isPastor, setIsPastor] = useState(false);
  const [pastorSession, setPastorSession] = useState(null);

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modals States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Load initial data and auth state
  const refreshData = () => {
    setRecords(getStoredRecords());
    setIsPastor(checkIsPastorLoggedIn());
    setPastorSession(getPastorSession());
  };

  useEffect(() => {
    refreshData();

    // Initial Cloud Fetch on Mount
    fetchFromCloudDB().then(() => refreshData());

    // Live Cross-Device Sync Polling every 3 seconds directly from GitHub API
    const intervalId = setInterval(() => {
      fetchFromCloudDB().then(() => refreshData());
    }, 3000);

    const handleDataEvent = () => refreshData();
    window.addEventListener('tmcf_records_updated', handleDataEvent);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('tmcf_records_updated', handleDataEvent);
    };
  }, []);

  // Handle Login & Logout
  const handleLoginSuccess = (session) => {
    setIsPastor(true);
    setPastorSession(session);
    // Celebrate Pastor login
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const handleLogout = () => {
    logoutPastor();
    setIsPastor(false);
    setPastorSession(null);
  };

  // Handle Record Add / Update
  const handleSaveRecord = (recordData, recordId) => {
    if (recordId) {
      updateRecord(recordId, recordData);
    } else {
      addRecord(recordData);
      // Trigger confetti celebration for new contribution
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 }
      });
    }
    refreshData();
  };

  // Handle Delete Record
  const handleDeleteRecord = (record) => {
    if (window.confirm(`Are you sure you want to delete collection record for "${record.name}" (₹${record.amount})?`)) {
      deleteRecord(record.id);
      refreshData();
    }
  };

  // Handle Target Goal Update
  const handleUpdateGoal = (newGoal) => {
    saveTargetGoal(newGoal);
    setTargetGoal(newGoal);
  };

  // Handle Reset Demo Data
  const handleResetData = () => {
    if (window.confirm("Reset all records to initial default church collection data?")) {
      resetRecordsToDefaults();
      refreshData();
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // Filter by Search Term (Name or Address or Notes)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Sort Records
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date + ' ' + (b.time || '')) - new Date(a.date + ' ' + (a.time || ''));
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date + ' ' + (a.time || '')) - new Date(b.date + ' ' + (b.time || ''));
      }
      if (sortBy === 'amount-desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'amount-asc') {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [records, searchTerm, sortBy]);

  return (
    <div className="app-container">
      
      {/* Header Bar */}
      <Header 
        isPastor={isPastor}
        pastorSession={pastorSession}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenDeployment={() => setIsDeploymentOpen(true)}
        onOpenFirebase={() => setIsFirebaseOpen(true)}
      />

      {/* Main Content Area */}
      <main>
        {/* Collection Overview */}
        <StatsOverview 
          records={records}
        />

        {/* Search, Excel Export & Control Bar */}
        <ExportBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filteredRecords={filteredAndSortedRecords}
          totalRecords={records.length}
          isPastor={isPastor}
          onAddNewRecord={() => { setEditingRecord(null); setIsFormOpen(true); }}
        />

        {/* Records Display (Grid or Table) */}
        <RecordList 
          records={filteredAndSortedRecords}
          viewMode={viewMode}
          isPastor={isPastor}
          onEditRecord={(rec) => { setEditingRecord(rec); setIsFormOpen(true); }}
          onDeleteRecord={handleDeleteRecord}
          onViewImage={(url, name) => setPreviewImage({ url, name })}
        />
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <Church size={15} style={{ color: 'var(--accent-gold)' }} />
          <span><strong>TMCF Church Reconstruction Fund</strong> • Built with Faith & Excellence</span>
        </div>
        <p>
          Pastor Pallapati Cornelius Portal • Public Ledger & XLSX Export Available 24/7
        </p>

        {isPastor && (
          <div style={{ marginTop: '0.75rem' }}>
            <button 
              onClick={handleResetData} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
            >
              Reset to Sample Data
            </button>
          </div>
        )}
      </footer>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <RecordFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRecord}
        editingRecord={editingRecord}
      />

      <ImagePreviewModal 
        imageUrl={previewImage?.url}
        donorName={previewImage?.name || ''}
        onClose={() => setPreviewImage(null)}
      />

      <DeploymentModal 
        isOpen={isDeploymentOpen}
        onClose={() => setIsDeploymentOpen(false)}
        onDataRestored={refreshData}
      />

      <FirebaseSetupModal 
        isOpen={isFirebaseOpen}
        onClose={() => setIsFirebaseOpen(false)}
        onFirebaseSaved={refreshData}
      />

    </div>
  );
}

export default App;

