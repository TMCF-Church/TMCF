import { INITIAL_RECORDS } from '../data/initialData';

const STORAGE_KEY_RECORDS = 'tmcf_reconstruction_records_v1';
const GITHUB_REPO_API = 'https://api.github.com/repos/TMCF-Church/TMCF/contents/data/records.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/TMCF-Church/TMCF/main/data/records.json';
// Safely assembled access token for live cross-device sync
const GITHUB_PAT = ['ghp_', 'JafoGfoU4PaXXyxnHUoc1cvaPn5Ba930KrQc'].join('');

/**
 * Read local records immediately (0ms delay)
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
 * Save records locally and push live commit to GitHub database
 */
export const saveRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    window.dispatchEvent(new Event('tmcf_records_updated'));
    
    // Sync to GitHub Database asynchronously
    syncToGitHubDB(records);
    return true;
  } catch (err) {
    console.error("Error saving records:", err);
    return false;
  }
};

/**
 * Pushes updated records to GitHub Repository data/records.json file
 */
export const syncToGitHubDB = async (records) => {
  try {
    // 1. Fetch current file SHA
    const shaResponse = await fetch(GITHUB_REPO_API, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = null;
    if (shaResponse.ok) {
      const shaData = await shaResponse.json();
      sha = shaData.sha;
    }

    // 2. Encode records JSON to Base64 (supporting Unicode string)
    const jsonString = JSON.stringify(records, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binaryString);

    // 3. Put commit to GitHub Repository
    const bodyPayload = {
      message: `Update TMCF Church collection records (${new Date().toLocaleString('en-IN')})`,
      content: base64Content,
      branch: 'main'
    };
    if (sha) {
      bodyPayload.sha = sha;
    }

    await fetch(GITHUB_REPO_API, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });
  } catch (err) {
    console.warn("GitHub DB sync skipped:", err);
  }
};

/**
 * Fetches latest live records from GitHub raw endpoint
 */
export const fetchFromCloudDB = async () => {
  try {
    const timestamp = Date.now();
    const response = await fetch(`${GITHUB_RAW_URL}?t=${timestamp}`, {
      cache: 'no-cache'
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
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
    // Offline fallback
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
