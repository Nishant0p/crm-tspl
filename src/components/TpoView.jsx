import React from 'react';

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

export default function TpoView({
  tpoSubView,
  setTpoSubView,
  tpoStateFilter,
  setTpoStateFilter,
  tpoCollegeFilter,
  setTpoCollegeFilter,
  candidates,
  colleges,
  jobs,
  linkingCandidateId,
  setLinkingCandidateId,
  linkingJobId,
  setLinkingJobId,
  handleTpoLink,
  gpsSuccess,
  gpsData,
  gpsLoading,
  handleGPSCheckin
}) {
  const filteredCandidates = candidates.filter(c => {
    const matchesState = !tpoStateFilter || c.state === tpoStateFilter;
    const matchesCollege = !tpoCollegeFilter || c.college === tpoCollegeFilter;
    return matchesState && matchesCollege;
  });

  const GPSCard = ({ fullWidth = false }) => (
    <div className="glass-panel" style={{ 
      padding: '24px', 
      background: 'rgba(255,255,255,0.35)', 
      border: '1px solid var(--glass-border)',
      width: fullWidth ? '100%' : 'auto'
    }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px' }}>📍 TPO GPS Telemetry</h3>
      <div style={{ fontSize: '13px', color: gpsSuccess ? 'var(--neon-green)' : 'var(--text-muted)', marginBottom: '16px', fontWeight: '600' }}>
        {gpsSuccess ? '📍 Location locked!' : 'No location captured yet.'}
      </div>
      {gpsSuccess && gpsData && (
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dark)' }}>Latitude:</span>
            <span style={{ color: 'var(--primary-blue)', fontFamily: 'monospace' }}>{gpsData.lat.toFixed(5)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dark)' }}>Longitude:</span>
            <span style={{ color: 'var(--primary-blue)', fontFamily: 'monospace' }}>{gpsData.lng.toFixed(5)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dark)' }}>Accuracy:</span>
            <span>{gpsData.accuracy}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dark)' }}>Timestamp:</span>
            <span>{gpsData.timestamp}</span>
          </div>
        </div>
      )}
      <button 
        className="btn-primary-arrow" 
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={handleGPSCheckin}
        disabled={gpsLoading}
      >
        {gpsLoading ? 'LOCATING...' : gpsSuccess ? 'REFRESH GPS' : 'CAPTURE GPS LOCATION'}
        <span className="circle"><ArrowSVG /></span>
      </button>
    </div>
  );

  return (
    <div className="view-section active unified-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease-out' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div className="view-title-wrap">
          <h1 style={{ color: 'var(--text-main)' }}>Training & Placement Office (TPO Linkages)</h1>
          <p>Link certified candidate rosters directly to published corporate job openings.</p>
        </div>
        <div className="filter-group">
          <button className={`chip ${tpoSubView === 'linkage' ? 'active' : ''}`} onClick={() => setTpoSubView('linkage')}>Linkage Board</button>
          <button className={`chip ${tpoSubView === 'gps' ? 'active' : ''}`} onClick={() => setTpoSubView('gps')}>GPS Telemetry</button>
        </div>
      </div>

      {tpoSubView === 'gps' ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <GPSCard fullWidth={true} />
        </div>
      ) : (
        <div className="tpo-grid">
          <div className="glass-panel unified-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 'bold' }}>Candidate Linkage Pairing Panel</h3>
            <form onSubmit={handleTpoLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Select Certified Candidate</label>
                <select className="select-filter" style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                  value={linkingCandidateId} onChange={e=>setLinkingCandidateId(e.target.value)} required>
                  <option value="">-- Choose Candidate --</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.college})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Corporate Job Opening</label>
                <select className="select-filter" style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                  value={linkingJobId} onChange={e=>setLinkingJobId(e.target.value)} required>
                  <option value="">-- Choose Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary-arrow" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}>
                Confirm Placement Linkage Pair
                <span className="circle"><ArrowSVG /></span>
              </button>
            </form>
          </div>

          <div className="glass-panel unified-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GPSCard />
            <div>
              <div className="portal-controls" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)' }}>Candidate Linkage Roster</h3>
                <div className="filter-group">
                  <select className="select-filter" value={tpoStateFilter} onChange={e=>{ setTpoStateFilter(e.target.value); setTpoCollegeFilter(''); }}>
                    <option value="">All Regions</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                  <select className="select-filter" value={tpoCollegeFilter} onChange={e=>setTpoCollegeFilter(e.target.value)}>
                    <option value="">All Colleges</option>
                    {colleges.filter(col => !tpoStateFilter || col.state === tpoStateFilter).map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="high-density-table-wrap" style={{ maxHeight: '280px' }}>
                <table className="hd-table">
                  <thead><tr><th>Student</th><th>Institution College</th><th>Region Hub</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredCandidates.map(c => (
                      <tr key={c.id}>
                        <td><div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{c.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.phone}</div></td>
                        <td style={{ color: 'var(--text-main)', fontWeight: '500' }}>{c.college}</td>
                        <td><div>{c.district}</div><div style={{ fontSize: '9px', color: 'var(--text-dark)' }}>{c.state}</div></td>
                        <td><span className={`status-badge ${c.status === 'Placed' ? 'status-placed' : c.status === 'Interviewing' ? 'status-interviewing' : 'status-sourced'}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}