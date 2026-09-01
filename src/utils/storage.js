import { INITIAL_RECORDS } from '../data/initialData';

const STORAGE_KEY_RECORDS = 'tmcf_reconstruction_records_v1';

// Firebase / Cloud REST Realtime Database URL for Cross-Device Multi-Phone/Laptop Sync
const CLOUD_SYNC_URL = 'https://tmcf-reconstruction-ledger-default-rtdb.firebaseio.com/collection_records.json';

/**
 * Get locally stored records immediately
 */
export const getStoredRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECORDS;
  } catch (err) {
    console.error("Error reading local records:", err);
    return INITIAL_RECORDS;
  }
};

/**
 * Save records locally and push live update to Cloud Database so all devices sync instantly
 */
export const saveRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    window.dispatchEvent(new Event('tmcf_records_updated'));
    
    // Sync to Cloud DB asynchronously for cross-device consistency
    syncToCloudDB(records);
    return true;
  } catch (err) {
    console.error("Error saving records:", err);
    return false;
  }
};

/**
 * Pushes records to Live Cloud Database
 */
export const syncToCloudDB = async (records) => {
  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
  } catch (err) {
    console.warn("Cloud DB push skipped (offline/local fallback active):", err);
  }
};

/**
 * Fetches latest live records from Cloud DB and updates local storage
 */
export const fetchFromCloudDB = async () => {
  try {
    const response = await fetch(CLOUD_SYNC_URL);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length >= 0) {
        const currentLocal = localStorage.getItem(STORAGE_KEY_RECORDS);
        const newCloudJson = JSON.stringify(data);
        
        if (currentLocal !== newCloudJson) {
          localStorage.setItem(STORAGE_KEY_RECORDS, newCloudJson);
          window.dispatchEvent(new Event('tmcf_records_updated'));
          return data;
        }
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
  return null;
};

export const addRecord = (newRecordData) => {
  const currentRecords = getStoredRecords();
  const newRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: newRecordData.name.trim(),
    address: newRecordData.address.trim(),
    amount: parseFloat(newRecordData.amount) || 0,
    date: newRecordData.date || new Date().toISOString().split('T')[0],
    time: newRecordData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    imageUrl: newRecordData.imageUrl || null,
    notes: newRecordData.notes ? newRecordData.notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  const updatedRecords = [newRecord, ...currentRecords];
  saveRecords(updatedRecords);
  return newRecord;
};

export const updateRecord = (id, updatedData) => {
  const currentRecords = getStoredRecords();
  const updatedRecords = currentRecords.map(rec => {
    if (rec.id === id) {
      return {
        ...rec,
        name: updatedData.name.trim(),
        address: updatedData.address.trim(),
        amount: parseFloat(updatedData.amount) || 0,
        date: updatedData.date,
        time: updatedData.time,
        imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl : rec.imageUrl,
        notes: updatedData.notes !== undefined ? updatedData.notes.trim() : rec.notes,
        updatedAt: new Date().toISOString()
      };
    }
    return rec;
  });

  saveRecords(updatedRecords);
  return true;
};

export const deleteRecord = (id) => {
  const currentRecords = getStoredRecords();
  const updatedRecords = currentRecords.filter(rec => rec.id !== id);
  saveRecords(updatedRecords);
  return true;
};

export const resetRecordsToDefaults = () => {
  saveRecords(INITIAL_RECORDS);
  return INITIAL_RECORDS;
};

// Export/Import Backup JSON
export const exportBackupJSON = () => {
  const records = getStoredRecords();
  const backupData = {
    appName: "TMCF Church Reconstruction Fund Tracker",
    exportedAt: new Date().toISOString(),
    recordsCount: records.length,
    records: records
  };
  return JSON.stringify(backupData, null, 2);
};

export const importBackupJSON = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.records)) {
      saveRecords(data.records);
      return { success: true, count: data.records.length };
    }
    return { success: false, message: "Invalid JSON format: missing records array." };
  } catch (err) {
    return { success: false, message: "Could not parse JSON file: " + err.message };
  }
};
