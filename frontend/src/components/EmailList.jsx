import { Sparkles, Clock } from 'lucide-react';

const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export default function EmailList({ emails, selectedId, onSelect, onSummarize }) {
  if (!emails.length) {
    return <div className="email-list empty">No emails found</div>;
  }

  return (
    <div className="email-list">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`email-item ${selectedId === email.id ? 'selected' : ''} ${
            email.summary?.priority ? `priority-${email.summary.priority}` : ''
          }`}
          onClick={() => onSelect(email)}
        >
          <div className="email-item-header">
            <span className="email-from">{extractName(email.from)}</span>
            <span className="email-date">{formatDate(email.date)}</span>
          </div>
          <div className="email-subject">{email.subject || '(no subject)'}</div>
          <div className="email-snippet">{email.snippet}</div>
          <div className="email-item-footer">
            {email.summarized ? (
              <span className="badge" style={{ background: priorityColors[email.summary?.priority] || '#666' }}>
                {email.summary?.priority} · {email.summary?.category}
              </span>
            ) : (
              <button
                className="btn btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSummarize(email.id);
                }}
              >
                <Sparkles size={14} /> Summarize
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function extractName(from) {
  if (!from) return 'Unknown';
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
