import React, { useState, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Separate Memoized Map Component to prevent lag on typing/dropdown select
const LiveTelemetryMap = memo(({ fieldAgents, setSelectedAgentId }) => {
  const mapCenter = [25.5941, 85.1376];
  
  return (
    <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fieldAgents.map(agent => {
        const markerColor = agent.status === 'Active' ? '#22c55e' : '#94a3b8';
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        return (
          <Marker 
            key={agent.id} 
            position={[agent.coords.lat, agent.coords.lng]} 
            icon={customIcon}
            eventHandlers={{
              click: () => setSelectedAgentId(agent.id)
            }}
          >
            <Popup>
              <strong>{agent.name}</strong><br />
              Status: {agent.status}<br />
              Region: {agent.region}<br />
              Candidates: {agent.candidatesSourced}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
});

export default function SourcingHeadView({
  selectedAgentId,
  setSelectedAgentId,
  fieldAgents,
  candidates,
  crmStateFilter,
  setCrmStateFilter,
  selectedDistricts,
  districtDropdownOpen,
  setDistrictDropdownOpen,
  crmSorting,
  setCrmSorting,
  DISTRICT_MAPPING,
  handleDistrictCheckbox,
  showAddCandidateModal,
  setShowAddCandidateModal,
  newCandidateData,
  setNewCandidateData,
  handleAddCandidateSourcing
}) {
  const [formErrors, setFormErrors] = useState({});

  // Optimized via useMemo: Avoids expensive recalculations on every single keypress
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesState = !crmStateFilter || c.state === crmStateFilter;
      const matchesDistrict = selectedDistricts.size === 0 || selectedDistricts.has(c.district);
      return matchesState && matchesDistrict;
    }).sort((a, b) => {
      if (crmSorting === 'newest') {
        return new Date(b.registeredDate) - new Date(a.registeredDate);
      }
      if (crmSorting === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (crmSorting === 'status') {
        const weight = { "Placed": 3, "Interviewing": 2, "Sourced": 1 };
        return (weight[b.status] || 0) - (weight[a.status] || 0);
      }
      return 0;
    });
  }, [candidates, crmStateFilter, selectedDistricts, crmSorting]);

  // Selected agent details caching
  const currentAgent = useMemo(() => {
    return fieldAgents.find(a => a.id === selectedAgentId);
  }, [fieldAgents, selectedAgentId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewCandidateData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newCandidateData.name) errors.name = 'Name is required';
    if (!newCandidateData.email) errors.email = 'Email is required';
    if (!newCandidateData.phone) errors.phone = 'Phone is required';
    if (!newCandidateData.college) errors.college = 'College is required';
    if (!newCandidateData.state) errors.state = 'State is required';
    if (!newCandidateData.district) errors.district = 'District is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    handleAddCandidateSourcing(newCandidateData);
    setNewCandidateData({
      name: '', email: '', phone: '', college: '', state: '', district: '',
      skills: '', status: 'Sourced', sourcingAgent: '',
      registeredDate: new Date().toISOString().split('T')[0]
    });
    setShowAddCandidateModal(false);
  };

  return (
    <div className="view-section active" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease-out' }}>
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div className="view-title-wrap">
          <h1 style={{ color: 'var(--text-main)' }}>Unified Candidate Sourcing CRM</h1>
          <p>Ground network maps, live telemetry metrics, and regional checks.</p>
        </div>
      </div>

      <div className="sourcing-grid" style={{ minHeight: '400px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 'bold' }}>Ground Operations Tracking (Live GPS Hub)</h3>
          <div id="real-map-container" style={{ flexGrow: 1, height: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <LiveTelemetryMap fieldAgents={fieldAgents} setSelectedAgentId={setSelectedAgentId} />
          </div>
        </div>

        <div className="glass-panel" id="agent-tracker-details" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentAgent ? (
            <>
              <div className="agent-header" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <img src={currentAgent.photo} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary-blue)', objectFit: 'cover' }} alt={currentAgent.name} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{currentAgent.name}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentAgent.region}</div>
                </div>
              </div>
              <div>
                <span className={`status-badge ${currentAgent.status === 'Active' ? 'status-placed' : 'status-interviewing'}`}>{currentAgent.status}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dark)', marginLeft: '10px' }}>Sync: {currentAgent.lastCheckIn}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--glass-border)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dark)' }}>Agent Contact:</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{currentAgent.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dark)' }}>Ground Coordinates:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--primary-blue)' }}>{currentAgent.coords.lat.toFixed(5)}° N, {currentAgent.coords.lng.toFixed(5)}° E</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dark)' }}>Sourced Register:</span>
                  <span style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>{currentAgent.candidatesSourced} Candidates</span>
                </div>
              </div>
              <div style={{ background: 'rgba(29,78,216,0.02)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-blue)', marginBottom: '4px' }}>Active Ground Telemetry Node</div>
                Agent routing parameters match state pipeline criteria. Synchronization check completed successfully.
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dark)', fontSize: '13px' }}>Choose agent on map to inspect coordinates.</div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="portal-controls" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Candidates Operational Registry</h3>
          <div className="filter-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="select-filter" value={crmStateFilter} onChange={e=>setCrmStateFilter(e.target.value)}>
              <option value="">All States</option>
              <option value="Bihar">Bihar</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Odisha">Odisha</option>
            </select>
            
            <div className="district-multi-select">
              <button className="multi-select-trigger" onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}>
                Districts filter ({selectedDistricts.size})
              </button>
              {districtDropdownOpen && (
                <div className="multi-select-dropdown active" style={{ top: '100%' }}>
                  {Object.keys(DISTRICT_MAPPING).map(state => 
                    (!crmStateFilter || state === crmStateFilter) && DISTRICT_MAPPING[state].map(dist => (
                      <div key={dist} className="multi-select-option" onClick={() => handleDistrictCheckbox(dist)}>
                        <input type="checkbox" checked={selectedDistricts.has(dist)} readOnly />
                        <label style={{ cursor: 'pointer', color: 'var(--text-main)' }}>{dist}</label>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <select className="select-filter" value={crmSorting} onChange={e=>setCrmSorting(e.target.value)}>
              <option value="newest">Sort: Newest</option>
              <option value="name_asc">Sort: Alphabetical</option>
              <option value="status">Sort: Placement Status</option>
            </select>

            <button className="btn-primary-arrow" onClick={() => setShowAddCandidateModal(true)}>
              + Add New Candidate
              <span className="circle">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 24, height: 24 }}>
                  <defs><linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient"><stop stopColor="#FFFFFF" stopOpacity="1" offset="0%" /><stop stopColor="#AAAAAA" stopOpacity="1" offset="100%" /></linearGradient></defs>
                  <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="high-density-table-wrap">
          <table className="hd-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate Info</th>
                <th>Contact Details</th>
                <th>Linked ITI / College</th>
                <th>Region Hub</th>
                <th>Sourcing Channel</th>
                <th>Placement Status</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-dark)', fontSize: '11px' }}>{c.id.substring(0, 8)}</td>
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {c.skills.map((s, i) => <span key={i} className="job-tag" style={{ fontSize: '9px', padding: '1px 4px' }}>{s}</span>)}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-main)' }}>{c.phone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email}</div>
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{c.college}</td>
                  <td>
                    <div style={{ color: 'var(--text-main)' }}>{c.district}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>{c.state}</div>
                  </td>
                  <td><span style={{ color: 'var(--primary-blue)' }}>{c.sourcingAgent}</span></td>
                  <td>
                    <span className={`status-badge ${c.status === 'Placed' ? 'status-placed' : c.status === 'Interviewing' ? 'status-interviewing' : 'status-sourced'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{c.registeredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddCandidateModal && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '600px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)' }}>Add New Candidate</h2>
              <button onClick={() => setShowAddCandidateModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-dark)' }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="config-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Candidate Name *</label>
                  <input type="text" name="name" className="form-input" placeholder="Rohan Sharma" value={newCandidateData.name} onChange={handleFormChange} />
                  {formErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" className="form-input" placeholder="rohan@gmail.com" value={newCandidateData.email} onChange={handleFormChange} />
                  {formErrors.email && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="text" name="phone" className="form-input" placeholder="9876543210" value={newCandidateData.phone} onChange={handleFormChange} />
                  {formErrors.phone && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label>Linked ITI / College *</label>
                  <input type="text" name="college" className="form-input" placeholder="Government ITI Patna" value={newCandidateData.college} onChange={handleFormChange} />
                  {formErrors.college && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.college}</span>}
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <select name="state" className="select-filter" value={newCandidateData.state} onChange={handleFormChange}>
                    <option value="">-- Select State --</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                  {formErrors.state && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.state}</span>}
                </div>
                <div className="form-group">
                  <label>District *</label>
                  <select name="district" className="select-filter" value={newCandidateData.district} onChange={handleFormChange}>
                    <option value="">-- Select District --</option>
                    {newCandidateData.state && DISTRICT_MAPPING[newCandidateData.state]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {formErrors.district && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.district}</span>}
                </div>
                <div className="form-group">
                  <label>Skills (comma separated)</label>
                  <input type="text" name="skills" className="form-input" placeholder="Ground Sourcing, MS Excel" value={newCandidateData.skills} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Placement Status</label>
                  <select name="status" className="select-filter" value={newCandidateData.status} onChange={handleFormChange}>
                    <option value="Sourced">Sourced</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Placed">Placed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sourcing Channel</label>
                  <input type="text" name="sourcingAgent" className="form-input" placeholder="Agent Name or Channel" value={newCandidateData.sourcingAgent} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Date Logged</label>
                  <input type="date" name="registeredDate" className="form-input" value={newCandidateData.registeredDate} onChange={handleFormChange} />
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCandidateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-arrow">
                  Add Candidate
                  <span className="circle">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 24, height: 24 }}>
                      <defs><linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient"><stop stopColor="#FFFFFF" stopOpacity="1" offset="0%" /><stop stopColor="#AAAAAA" stopOpacity="1" offset="100%" /></linearGradient></defs>
                      <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}