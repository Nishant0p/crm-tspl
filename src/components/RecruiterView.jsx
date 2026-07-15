// components/RecruiterView.jsx
import React from 'react';
import HRJobManagement from './HRJobManagement';

export default function RecruiterView({
  mobileActiveSubview,
  setMobileActiveSubview,
  // Intake Form
  intakeName, setIntakeName,
  intakePhone, setIntakePhone,
  intakeState, setIntakeState,
  intakeDistrict, setIntakeDistrict,
  intakeCollege, setIntakeCollege,
  intakePhotoName,
  intakePhoto,
  handlePhotoUpload,
  handleIntakeSubmit,
  // Excel Sync
  excelPreviewVisible,
  triggerExcelUpload,
  executeExcelSync,
  EXCEL_MOCK_DATA,
  DISTRICT_MAPPING,
  // New props for HR Job Management
  jobs,
  candidates,
  applications,
  updateApplicationStatus,
  generateOffer,
  showToast
}) {
  const activeSubviewLabel =
    mobileActiveSubview === 'mobile-sub-dataentry'
      ? 'Candidate Intake'
      : mobileActiveSubview === 'mobile-sub-sync'
        ? 'Offline Sync'
        : 'HR Job Management';

  const ArrowSVG = () => (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 24, height: 24 }}>
      <defs>
        <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient">
          <stop style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} offset="0%" />
          <stop style={{ stopColor: '#AAAAAA', stopOpacity: 1 }} offset="100%" />
        </linearGradient>
      </defs>
      <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
    </svg>
  );

  return (
    <div className="view-section active unified-section" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div className="view-title-wrap">
          <h1 style={{ color: 'var(--text-main)' }}>HR Recruiter Field Console</h1>
          <p>Unified mobile operations panel for candidate intake and offline roster sync.</p>
        </div>
      </div>

      <div className="hr-layout">
        <div className="hr-side-column">
          <div className="glass-panel unified-card hr-summary-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>HR Operations Snapshot</h3>
            <div className="hr-metrics-grid">
              <div className="hr-metric-item">
                <span>Current Flow</span>
                <strong>{activeSubviewLabel}</strong>
              </div>
              <div className="hr-metric-item">
                <span>Batch Rows Ready</span>
                <strong>{EXCEL_MOCK_DATA.length}</strong>
              </div>
            </div>
          </div>

          <div className="glass-panel unified-card hr-summary-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>Quick Navigation</h3>
            <div className="hr-quick-actions">
              <button className={`btn-secondary ${mobileActiveSubview === 'mobile-sub-dataentry' ? 'hr-active-action' : ''}`} onClick={() => setMobileActiveSubview('mobile-sub-dataentry')}>
                Open Intake Form
              </button>
              <button className={`btn-secondary ${mobileActiveSubview === 'mobile-sub-sync' ? 'hr-active-action' : ''}`} onClick={() => setMobileActiveSubview('mobile-sub-sync')}>
                Open Excel Sync
              </button>
              <button className={`btn-secondary ${mobileActiveSubview === 'hr-jobs' ? 'hr-active-action' : ''}`} onClick={() => setMobileActiveSubview('hr-jobs')}>
                Job Management
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel unified-card hr-main-panel" style={{ padding: '24px' }}>
          <div className="portal-controls" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Recruiter Action Workspace</h3>
            <div className="filter-group">
              <span className="status-badge status-sourced">{activeSubviewLabel}</span>
            </div>
          </div>

          {mobileActiveSubview === 'mobile-sub-dataentry' && (
            <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-main)' }}>New Sourcing Registry</h3>

              <div className="form-group">
                <label style={{ fontSize: '10px' }}>Name</label>
                <input type="text" className="form-input" placeholder="Rohan Sharma" style={{ padding: '8px', fontSize: '12px' }} value={intakeName} onChange={e => setIntakeName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '10px' }}>Phone</label>
                <input type="text" className="form-input" placeholder="9876543210" style={{ padding: '8px', fontSize: '12px' }} value={intakePhone} onChange={e => setIntakePhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '10px' }}>State</label>
                <select className="select-filter" style={{ padding: '8px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} value={intakeState} onChange={e => {
                  setIntakeState(e.target.value);
                }} required>
                  <option value="">-- State --</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Odisha">Odisha</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '10px' }}>District</label>
                <select className="select-filter" style={{ padding: '8px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} value={intakeDistrict} onChange={e => setIntakeDistrict(e.target.value)} required>
                  <option value="">-- District --</option>
                  {intakeState && DISTRICT_MAPPING[intakeState]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '10px' }}>ITI College</label>
                <input type="text" className="form-input" placeholder="Govt ITI Patna" style={{ padding: '8px', fontSize: '12px' }} value={intakeCollege} onChange={e => setIntakeCollege(e.target.value)} required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '10px' }}>Intake Document Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ flexGrow: 1, padding: '8px', border: '1px dashed var(--glass-border)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {intakePhotoName ? intakePhotoName : '📷 Capture Form'}
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                {intakePhoto && (
                  <div style={{ border: '1px solid var(--glass-border)', borderRadius: '6px', overflow: 'hidden', height: '60px' }}>
                    <img src={intakePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="uploaded preview" />
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary-arrow" style={{ width: '100%', justifyContent: 'center' }}>
                Sync Lead to Central DB
                <span className="circle"><ArrowSVG /></span>
              </button>
            </form>
          )}

          {mobileActiveSubview === 'mobile-sub-sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-main)' }}>Offline Bulk Sync</h3>

              <div className="glass-panel" style={{ padding: '16px', border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Upload external Excel spreadsheet candidate registers locally.</p>

                <button className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '8px' }} onClick={triggerExcelUpload}>
                  📂 Select Excel File (.xlsx)
                </button>
              </div>

              {excelPreviewVisible && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Roster Preview (4 candidates)</div>
                  <div style={{ overflowX: 'auto', maxHeight: '160px' }}>
                    <table className="hd-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EXCEL_MOCK_DATA.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.name}</td>
                            <td>{row.phone}</td>
                            <td>{row.district}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn-primary-arrow" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} onClick={executeExcelSync}>
                    Synchronize to Central CRM
                    <span className="circle"><ArrowSVG /></span>
                  </button>
                </div>
              )}
            </div>
          )}

          {mobileActiveSubview === 'hr-jobs' && (
            <HRJobManagement
              jobs={jobs}
              candidates={candidates}
              applications={applications}
              updateApplicationStatus={updateApplicationStatus}
              generateOffer={generateOffer}
              showToast={showToast}
            />
          )}

        </div>
      </div>

    </div>
  );
}