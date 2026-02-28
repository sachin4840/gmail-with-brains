import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';

export default function ActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();
  }, [user]);

  if (loading) return <div className="activity-log loading">Loading activity...</div>;

  return (
    <div className="activity-log">
      <h2><Clock size={20} /> Activity Log</h2>
      {logs.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td><span className="action-badge">{log.action}</span></td>
                <td className="details-cell">
                  {formatDetails(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDetails(details) {
  if (!details) return '-';
  if (typeof details === 'string') return details;
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}
