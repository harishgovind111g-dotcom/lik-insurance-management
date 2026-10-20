import { Fragment, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import Icon from './Icon.jsx';

// "LIK Assistant": chat box powered by Google Gemini through POST /api/assistant/chat.
// The Gemini API key stays on the server; the browser never sees it.

const MAX_HISTORY = 8;
const SUGGESTIONS = [
  'Which health plan suits a family?',
  'How do I file a claim?',
  'Compare the car insurance plans'
];
const GREETING = 'Hi! I am the LIK Assistant. Ask me about our insurance plans, buying a policy, or filing and tracking a claim.';

/** Renders **bold** and "- " bullet lines from the reply as safe React elements. */
function Formatted({ text }) {
  const blocks = [];
  let list = null;
  String(text).split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/^\s*[-*•]\s+(.*)$/);
    if (m) {
      if (!list) { list = []; blocks.push(list); }
      list.push(m[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push(line);
    }
  });
  const inline = (s) => s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
  return blocks.map((b, i) => (Array.isArray(b)
    ? <ul key={i}>{b.map((li, j) => <li key={j}>{inline(li)}</li>)}</ul>
    : <p key={i}>{inline(b)}</p>));
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', text: GREETING, greeting: true }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  // A different user gets a fresh conversation.
  useEffect(() => { setMessages([{ role: 'model', text: GREETING, greeting: true }]); }, [user?.id]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    const history = messages
      .filter((m) => !m.greeting && !m.error)
      .slice(-MAX_HISTORY)
      .map(({ role, text: t }) => ({ role, text: t }));

    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const res = await api.post('/assistant/chat', { message, history });
      setMessages((m) => [...m, { role: 'model', text: res.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'model', text: err.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open LIK Assistant">
          <Icon name="sparkle" size={20} />
          <span>Ask LIK AI</span>
        </button>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label="LIK Assistant">
          <header className="chat-head">
            <span className="chat-avatar"><Icon name="sparkle" size={18} /></span>
            <div>
              <strong>LIK Assistant</strong>
              <span>Powered by Google Gemini · general help, not financial advice</span>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant"><Icon name="close" size={20} /></button>
          </header>

          <div className="chat-log" ref={logRef} role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role === 'user' ? 'me' : 'bot'} ${m.error ? 'err' : ''}`}>
                {m.role === 'user' ? m.text : <Formatted text={m.text} />}
              </div>
            ))}
            {busy && <div className="bubble bot typing"><span /><span /><span /></div>}
          </div>

          {messages.length === 1 && (
            <div className="chat-chips">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
            </div>
          )}

          <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <label className="sr-only" htmlFor="chat-input">Your question</label>
            <textarea id="chat-input" ref={inputRef} rows={1} maxLength={500} value={input}
              placeholder="Ask about plans or claims…" onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} />
            <button type="submit" className="chat-send" disabled={busy || !input.trim()} aria-label="Send">
              <Icon name="send" size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
