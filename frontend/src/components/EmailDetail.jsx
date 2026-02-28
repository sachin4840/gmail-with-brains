import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { Sparkles, Send, Zap, Copy, Check } from 'lucide-react';

export default function EmailDetail({ email, onSummarize, supabaseToken }) {
  const [instruction, setInstruction] = useState('');
  const [actionResult, setActionResult] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!email) {
    return (
      <div className="email-detail empty">
        <p>Select an email to view details</p>
      </div>
    );
  }

  const handleExecute = async () => {
    if (!instruction.trim()) return;
    setExecuting(true);
    try {
      const data = await apiFetch('/actions/execute', {
        method: 'POST',
        body: { emailId: email.id, instruction },
        supabaseToken,
        
      });
      setActionResult(data.result);
    } catch (err) {
      setActionResult(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyDraft.trim()) return;
    setSending(true);
    try {
      await apiFetch('/actions/reply', {
        method: 'POST',
        body: { emailId: email.id, replyBody: replyDraft },
        supabaseToken,
        
      });
      setReplyDraft('');
      alert('Reply sent!');
    } catch (err) {
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const useSuggestedReply = () => {
    if (email.summary?.suggestedReply) {
      setReplyDraft(email.summary.suggestedReply);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="email-detail">
      <div className="detail-header">
        <h2>{email.subject || '(no subject)'}</h2>
        <div className="detail-meta">
          <span><strong>From:</strong> {email.from}</span>
          <span><strong>To:</strong> {email.to}</span>
          <span><strong>Date:</strong> {email.date}</span>
        </div>
      </div>

      {/* Summary Section */}
      {email.summarized && email.summary ? (
        <div className="summary-card">
          <h3><Sparkles size={16} /> AI Summary</h3>
          <p>{email.summary.summary}</p>

          {email.summary.actionItems?.length > 0 && (
            <div className="action-items">
              <h4>Action Items:</h4>
              <ul>
                {email.summary.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="summary-meta">
            <span className={`priority-badge priority-${email.summary.priority}`}>
              {email.summary.priority} priority
            </span>
            <span className="category-badge">{email.summary.category}</span>
          </div>

          {email.summary.suggestedReply && (
            <div className="suggested-reply">
              <h4>Suggested Reply:</h4>
              <p>{email.summary.suggestedReply}</p>
              <button className="btn btn-small" onClick={useSuggestedReply}>
                Use as draft
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="btn btn-primary" onClick={() => onSummarize(email.id)}>
          <Sparkles size={16} /> Summarize this email
        </button>
      )}

      {/* Instruction Executor */}
      <div className="instruction-section">
        <h3><Zap size={16} /> Execute Instruction</h3>
        <div className="instruction-input">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="e.g., Draft a polite decline, Extract all dates mentioned, Summarize for my boss..."
          />
          <button className="btn btn-primary" onClick={handleExecute} disabled={executing}>
            {executing ? 'Processing...' : 'Execute'}
          </button>
        </div>
        {actionResult && (
          <div className="action-result">
            <div className="result-header">
              <h4>Result:</h4>
              <button className="btn btn-icon" onClick={() => copyToClipboard(actionResult)}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre>{actionResult}</pre>
          </div>
        )}
      </div>

      {/* Reply Section */}
      <div className="reply-section">
        <h3><Send size={16} /> Reply</h3>
        <textarea
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          placeholder="Write your reply..."
          rows={5}
        />
        <button className="btn btn-primary" onClick={handleSendReply} disabled={sending || !replyDraft.trim()}>
          {sending ? 'Sending...' : 'Send Reply'}
        </button>
      </div>

      {/* Email Body */}
      <div className="email-body">
        <h3>Original Email</h3>
        <div className="body-content">{email.body || email.snippet}</div>
      </div>
    </div>
  );
}
