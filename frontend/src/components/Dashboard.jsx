import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import ActivityLog from './ActivityLog';
import { LogOut, RefreshCw, Mail, Activity, Sparkles, Unlink, Inbox } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut, supabaseToken } = useAuth();
  const navigate = useNavigate();
  const [gmailStatus, setGmailStatus] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('emails');
  const [days, setDays] = useState(3);
  const [summarizing, setSummarizing] = useState(false);

  // Check Gmail connection on mount
  useEffect(() => {
    checkGmailAndFetch();
  }, [supabaseToken]);

  const checkGmailAndFetch = async () => {
    if (!supabaseToken) return;
    try {
      const status = await apiFetch('/gmail/status', { supabaseToken });
      setGmailStatus(status);
      if (!status.connected) {
        navigate('/connect');
        return;
      }
      // Auto-fetch emails
      fetchEmails();
    } catch (err) {
      navigate('/connect');
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/emails?days=${days}`, { supabaseToken });
      setEmails(data.emails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (emailId) => {
    try {
      const data = await apiFetch(`/emails/${emailId}/summarize`, {
        method: 'POST',
        supabaseToken,
      });

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId ? { ...e, summary: data.summary, summarized: true } : e
        )
      );

      if (selectedEmail?.id === emailId) {
        setSelectedEmail((prev) => ({ ...prev, summary: data.summary, summarized: true }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSummarizeAll = async () => {
    const unsummarized = emails.filter((e) => !e.summarized).map((e) => e.id);
    if (!unsummarized.length) return;

    setSummarizing(true);
    try {
      const data = await apiFetch('/emails/summarize-all', {
        method: 'POST',
        body: { emailIds: unsummarized },
        supabaseToken,
      });

      const summaryMap = {};
      data.results.forEach((r) => {
        summaryMap[r.emailId] = r.summary;
      });

      setEmails((prev) =>
        prev.map((e) =>
          summaryMap[e.id] ? { ...e, summary: summaryMap[e.id], summarized: true } : e
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSummarizing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Gmail? You can reconnect anytime.')) return;
    try {
      await apiFetch('/gmail/disconnect', { method: 'POST', supabaseToken });
      navigate('/connect');
    } catch (err) {
      setError(err.message);
    }
  };

  const unsummarizedCount = emails.filter((e) => !e.summarized).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <Mail size={24} />
          <h1>Gmail with Brains</h1>
        </div>
        <div className="header-right">
          {gmailStatus?.connected && (
            <span className="gmail-badge">
              📧 {gmailStatus.email}
            </span>
          )}
          <span className="user-email">{user?.email}</span>
          <button
            className={`btn btn-icon ${view === 'emails' ? 'active' : ''}`}
            onClick={() => setView('emails')}
            title="Emails"
          >
            <Mail size={18} />
          </button>
          <button
            className={`btn btn-icon ${view === 'activity' ? 'active' : ''}`}
            onClick={() => setView('activity')}
            title="Activity Log"
          >
            <Activity size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleDisconnect} title="Disconnect Gmail">
            <Unlink size={18} />
          </button>
          <button className="btn btn-icon" onClick={signOut} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {view === 'activity' ? (
        <ActivityLog />
      ) : (
        <div className="email-container">
          <div className="email-toolbar">
            <div className="search-bar">
              <select value={days} onChange={(e) => setDays(e.target.value)} className="days-select">
                <option value={1}>Last 1 day</option>
                <option value={3}>Last 3 days</option>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
              <button className="btn btn-accent" onClick={fetchEmails} disabled={loading}>
                <Inbox size={16} className={loading ? 'spin' : ''} />
                {loading ? 'Checking...' : 'Check New Email'}
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSummarizeAll}
              disabled={summarizing || !unsummarizedCount}
            >
              <Sparkles size={16} />
              {summarizing ? 'Summarizing...' : `Summarize All (${unsummarizedCount})`}
            </button>
          </div>

          <div className="email-layout">
            <EmailList
              emails={emails}
              selectedId={selectedEmail?.id}
              onSelect={setSelectedEmail}
              onSummarize={handleSummarize}
            />
            <EmailDetail
              email={selectedEmail}
              onSummarize={handleSummarize}
              supabaseToken={supabaseToken}
            />
          </div>
        </div>
      )}
    </div>
  );
}
