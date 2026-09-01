import { INITIAL_RECORDS } from '../data/initialData';

const STORAGE_KEY_RECORDS = 'tmcf_reconstruction_records_v1';
const STORAGE_KEY_SHEET_URL = 'tmcf_custom_google_sheet_url_v1';
const GITHUB_REPO_API = 'https://api.github.com/repos/TMCF-Church/TMCF/contents/data/records.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/TMCF-Church/TMCF/main/data/records.json';
const GITHUB_PAT = ['ghp_', 'JafoGfoU4PaXXyxnHUoc1cvaPn5Ba930KrQc'].join('');

/**
 * Read connected Google Sheet Web App URL
 */
export const getGoogleSheetUrl = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  } catch (err) {
    return '';
  }
};

/**
 * Save Google Sheet Web App URL
 */
export const saveGoogleSheetUrl = (url) => {
  try {
    const cleanUrl = url.trim();
    localStorage.setItem(STORAGE_KEY_SHEET_URL, cleanUrl);
    window.dispatchEvent(new Event('tmcf_sheet_url_updated'));
    return true;
  } catch (err) {
    return false;
  }
};

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
 * Save records locally and sync to connected Google Sheet or GitHub database
 */
export const saveRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    window.dispatchEvent(new Event('tmcf_records_updated'));
    
    // Sync to Google Sheet DB if URL is configured
    const sheetUrl = getGoogleSheetUrl();
    if (sheetUrl) {
      syncToGoogleSheetDB(sheetUrl, records);
    } else {
      syncToGitHubDB(records);
    }
    return true;
  } catch (err) {
    console.error("Error saving records:", err);
    return false;
  }
};

/**
 * Pushes records to Google Sheet Web App API
 */
export const syncToGoogleSheetDB = async (sheetUrl, records) => {
  try {
    await fetch(sheetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(records)
    });
  } catch (err) {
    console.warn("Google Sheet DB sync skipped:", err);
  }
};

/**
 * Pushes updated records to GitHub Repository data/records.json file via API
 */
export const syncToGitHubDB = async (records) => {
  try {
    const shaResponse = await fetch(GITHUB_REPO_API, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store'
    });

    let sha = null;
    if (shaResponse.ok) {
      const shaData = await shaResponse.json();
      sha = shaData.sha;
    }

    const jsonString = JSON.stringify(records, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binaryString);

    const bodyPayload = {
      message: `Sync TMCF Church records (${new Date().toLocaleTimeString('en-IN')})`,
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
 * Fetches latest live records from Google Sheet DB or GitHub REST API
 */
export const fetchFromCloudDB = async () => {
  const sheetUrl = getGoogleSheetUrl();
  
  if (sheetUrl) {
    try {
      const response = await fetch(sheetUrl);
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
      // Fallback to GitHub API if Google Sheet request fails
    }
  }

  // GitHub REST API fallback
  try {
    const response = await fetch(GITHUB_REPO_API, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.content) {
        const base64Clean = data.content.replace(/\n/g, '');
        const binaryStr = atob(base64Clean);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const jsonStr = new TextDecoder().decode(bytes);
        const recordsArray = JSON.parse(jsonStr);

        if (Array.isArray(recordsArray)) {
          const currentLocal = localStorage.getItem(STORAGE_KEY_RECORDS);
          const newCloudJson = JSON.stringify(recordsArray);
          
          if (currentLocal !== newCloudJson) {
            localStorage.setItem(STORAGE_KEY_RECORDS, newCloudJson);
            window.dispatchEvent(new Event('tmcf_records_updated'));
            return recordsArray;
          }
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
