import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import ActivityLog from './ActivityLog';
import { LogOut, RefreshCw, Mail, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut, supabaseToken, googleToken } = useAuth();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('emails'); // 'emails' | 'activity'
  const [query, setQuery] = useState('is:inbox');

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/emails?maxResults=20&query=${encodeURIComponent(query)}`, {
        supabaseToken,
        googleToken,
      });
      setEmails(data.emails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabaseToken && googleToken) {
      fetchEmails();
    }
  }, [supabaseToken, googleToken]);

  const handleSummarize = async (emailId) => {
    try {
      const data = await apiFetch(`/emails/${emailId}/summarize`, {
        method: 'POST',
        supabaseToken,
        googleToken,
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

    setLoading(true);
    try {
      const data = await apiFetch('/emails/summarize-all', {
        method: 'POST',
        body: { emailIds: unsummarized },
        supabaseToken,
        googleToken,
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
      setLoading(false);
    }
  };

  if (!googleToken) {
    return (
      <div className="no-token">
        <p>Google access token expired. Please sign out and sign in again.</p>
        <button className="btn" onClick={signOut}>Sign Out & Re-authenticate</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <Mail size={24} />
          <h1>Gmail Summarizer</h1>
        </div>
        <div className="header-right">
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
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEmails()}
                placeholder="Gmail search query..."
              />
              <button className="btn" onClick={fetchEmails} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                {loading ? 'Loading...' : 'Fetch'}
              </button>
            </div>
            <button className="btn btn-primary" onClick={handleSummarizeAll} disabled={loading}>
              Summarize All
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
              googleToken={googleToken}
            />
          </div>
        </div>
      )}
    </div>
  );
}
