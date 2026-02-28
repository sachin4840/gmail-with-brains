import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Mail, Link, AlertCircle, LogOut } from 'lucide-react';

export default function ConnectGmail() {
  const { supabaseToken, signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if already connected
  useEffect(() => {
    checkConnection();
  }, [supabaseToken]);

  // Check for error from callback
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setError(`Gmail connection failed: ${err}. Please try again.`);
    }
  }, [searchParams]);

  const checkConnection = async () => {
    if (!supabaseToken) return;
    try {
      const data = await apiFetch('/gmail/status', { supabaseToken });
      if (data.connected) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Not connected, stay on page
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/gmail/auth-url', { supabaseToken });
      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="loading-screen">Checking Gmail connection...</div>;
  }

  return (
    <div className="connect-page">
      <div className="connect-card">
        <div className="connect-icon">
          <Mail size={48} />
        </div>
        <h1>Connect Your Gmail</h1>
        <p>Welcome, <strong>{user?.email}</strong>!</p>
        <p className="connect-desc">
          Connect your Gmail account to let the AI read, summarize, and help you 
          manage your emails. We'll pull your last 3 days of emails to get started.
        </p>

        {error && (
          <div className="form-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="permissions-box">
          <h3>What we'll access:</h3>
          <ul>
            <li>📧 Read your emails (last 3 days)</li>
            <li>✉️ Send replies on your behalf (only when you ask)</li>
            <li>🔒 Your data stays private — no sharing with third parties</li>
          </ul>
        </div>

        <button className="btn btn-primary btn-full" onClick={handleConnect} disabled={loading}>
          <Link size={18} />
          {loading ? 'Connecting...' : 'Connect Gmail Account'}
        </button>

        <button className="btn btn-secondary btn-full" onClick={signOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
