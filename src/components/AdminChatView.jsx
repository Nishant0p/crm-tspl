import React, { useState, useEffect, useRef } from 'react';

export default function AdminChatView({ currentUser, showToast, API_BASE = '' }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets`, {
        headers: { 'x-admin-email': currentUser.email }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId) => {
    if (!currentUser) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/tickets/${ticketId}/messages?email=${encodeURIComponent(currentUser.email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
      setMessages(data.messages || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          message: newMessage.trim(),
          isAdmin: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      fetchTickets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const closeTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: { 'x-admin-email': currentUser.email }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close ticket');
      showToast('Ticket closed', 'success');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: 'closed' }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const reopenTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets/${ticketId}/reopen`, {
        method: 'POST',
        headers: { 'x-admin-email': currentUser.email }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reopen ticket');
      showToast('Ticket reopened', 'success');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: 'open' }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (selectedTicket) fetchMessages(selectedTicket.id);
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', fontWeight: '700' }}>
            Support Tickets
            {openCount > 0 && (
              <span style={{ marginLeft: '8px', background: '#F97316', color: '#FFF', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                {openCount} open
              </span>
            )}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Manage candidate support conversations</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['all', 'open', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: filter === f ? '#1E3A8A' : '#F1F5F9',
                color: filter === f ? '#FFF' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchTickets}
            style={{ padding: '5px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          Loading tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No {filter !== 'all' ? filter : ''} tickets found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', minHeight: '520px' }}>
          {/* Ticket List Panel */}
          <div className="glass-panel" style={{ flex: '0 0 300px', overflowY: 'auto', padding: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', maxHeight: '540px' }}>
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  background: selectedTicket?.id === ticket.id ? '#EFF6FF' : 'transparent',
                  borderLeft: `3px solid ${ticket.status === 'closed' ? '#CBD5E1' : '#F97316'}`,
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1E293B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.subject}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', flexShrink: 0,
                    background: ticket.status === 'closed' ? '#F1F5F9' : '#FFF7ED',
                    color: ticket.status === 'closed' ? '#94A3B8' : '#C2410C'
                  }}>
                    {ticket.status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#1E3A8A', fontWeight: '500', marginTop: '3px' }}>
                  {ticket.user_name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.last_message || 'No messages yet'}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
                  {ticket.admin_replies > 0 && <span>💬 {ticket.admin_replies}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Window */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#F8FAFC' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      {selectedTicket.user_name} • {selectedTicket.user_email}
                      <span style={{
                        marginLeft: '8px', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
                        background: selectedTicket.status === 'closed' ? '#F1F5F9' : '#FFF7ED',
                        color: selectedTicket.status === 'closed' ? '#94A3B8' : '#C2410C'
                      }}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    {selectedTicket.status === 'open' ? (
                      <button
                        onClick={() => closeTicket(selectedTicket.id)}
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569', cursor: 'pointer' }}
                      >
                        ✅ Close Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => reopenTicket(selectedTicket.id)}
                        style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#FFF', color: '#1E3A8A', cursor: 'pointer' }}
                      >
                        🔁 Reopen
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC' }}>
                  {messagesLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                      No messages yet.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isFromAdmin = msg.sender_id !== selectedTicket.user_id;
                      return (
                        <div key={msg.id} style={{ alignSelf: isFromAdmin ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                          <div style={{
                            background: isFromAdmin ? '#1E3A8A' : '#FFFFFF',
                            color: isFromAdmin ? '#FFFFFF' : '#1E293B',
                            padding: '10px 14px', borderRadius: isFromAdmin ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            fontSize: '13px', lineHeight: '1.5',
                            border: isFromAdmin ? 'none' : '1px solid #E2E8F0',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.75 }}>
                              {msg.sender_name || (isFromAdmin ? 'Admin' : 'User')}
                            </div>
                            {msg.message}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', textAlign: isFromAdmin ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {selectedTicket.status === 'open' ? (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px', background: '#FFFFFF' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type admin reply..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      style={{ flex: 1, borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                    <button
                      onClick={sendMessage}
                      className="btn-primary"
                      style={{ padding: '8px 20px', borderRadius: '8px', flexShrink: 0, fontSize: '13px' }}
                    >
                      Send Reply
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '13px', background: '#F8FAFC' }}>
                    Ticket closed — reopen to reply.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px' }}>💬</div>
                <p style={{ fontSize: '14px' }}>Select a ticket to view the conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
