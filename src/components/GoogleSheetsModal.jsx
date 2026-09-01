import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, CheckCircle, Copy, ExternalLink, AlertCircle, Check } from 'lucide-react';
import { getGoogleSheetUrl, saveGoogleSheetUrl } from '../utils/storage';

export const GOOGLE_APPS_SCRIPT_CODE = `function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) {
      records.push({
        id: String(row[0]),
        name: String(row[1]),
        address: String(row[2]),
        amount: Number(row[3]) || 0,
        date: String(row[4]),
        time: String(row[5]),
        imageUrl: row[6] ? String(row[6]) : null,
        notes: row[7] ? String(row[7]) : ''
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(records)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 8).setValues([["ID", "Donor Name", "Address", "Amount (INR)", "Date", "Time", "Image URL", "Notes"]]);
  if (Array.isArray(data) && data.length > 0) {
    var rows = [];
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      rows.push([r.id, r.name, r.address, r.amount, r.date, r.time, r.imageUrl || '', r.notes || '']);
    }
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}`;

export const GoogleSheetsModal = ({ isOpen, onClose, onSheetSaved }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSheetUrl(getGoogleSheetUrl());
      setStatusMsg(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your Google Web App URL.' });
      return;
    }

    const success = saveGoogleSheetUrl(sheetUrl);
    if (success) {
      setStatusMsg({ type: 'success', text: 'Google Sheet connected successfully! Live multi-device sync is active.' });
      if (onSheetSaved) onSheetSaved();
      setTimeout(() => onClose(), 1500);
    } else {
      setStatusMsg({ type: 'error', text: 'Could not save Google Sheet URL.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', pb: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald-light)' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }} className="gradient-text-emerald">
                Connect Google Sheets Database
              </h2>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Store collection records directly in Google Sheets</span>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Step 1: Copy Script */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                Step 1: Copy Google Apps Script Code
              </h4>
              <button onClick={handleCopyScript} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}>
                {copied ? <Check size={14} style={{ color: 'var(--accent-emerald-light)' }} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            <pre style={{ background: '#090d16', padding: '0.65rem', borderRadius: '6px', fontSize: '0.725rem', color: '#a7f3d0', maxHeight: '110px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>

          {/* Step 2: Setup Instructions */}
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Step 2: Create & Deploy Google Sheet (3 Simple Steps)
            </h4>
            <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Open <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>sheets.new</a> to open a new Google Sheet.</li>
              <li>Click <strong>Extensions</strong> → <strong>Apps Script</strong> → delete everything in the code editor → <strong>Paste the copied script above</strong> → click <strong>Save (Ctrl+S)</strong>.</li>
              <li>Click <strong>Deploy</strong> → <strong>New Deployment</strong> → select <strong>Web App</strong> → set <i>Who has access</i> to <strong>"Anyone"</strong> → click <strong>Deploy</strong> → <strong>Copy Web App URL</strong>!</li>
            </ol>
          </div>

          {/* Step 3: Paste Web App URL */}
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ color: 'var(--accent-emerald-light)' }}>
                Step 3: Paste Google Web App URL Below *
              </label>
              <input 
                type="url" 
                className="form-control"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-emerald">
                <FileSpreadsheet size={16} /> Connect Google Sheet
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
