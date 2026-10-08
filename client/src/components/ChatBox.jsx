import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatBox({ farmhouseId, receiverId, compact = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const chatMessagesRef = useRef(null);

  const load = useCallback(async (showError = true) => {
    if (!farmhouseId) return;

    try {
      const query = receiverId ? `?userId=${encodeURIComponent(receiverId)}` : '';
      const response = await api.get(`/chat/${farmhouseId}${query}`);
      setMessages(response.data.messages || []);
      if (showError) setErr('');
    } catch (error) {
      if (showError) {
        setErr(error.response?.data?.message || 'Unable to load chat.');
      }
    }
  }, [farmhouseId, receiverId]);

  useEffect(() => {
    load();

    // Keep the conversation in sync so an owner's reply appears for the
    // customer without requiring a page refresh.
    const timer = window.setInterval(() => load(false), 2000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    // Scroll only inside the chat message panel. Do NOT use scrollIntoView()
    // here because it can scroll the entire Owner Dashboard page to the chat.
    const panel = chatMessagesRef.current;
    if (!panel) return;

    panel.scrollTop = panel.scrollHeight;
  }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setErr('');

    try {
      const response = await api.post(`/chat/${farmhouseId}`, {
        message,
        receiverId: receiverId || undefined,
      });

      setMessages((items) => {
        const alreadyAdded = items.some((item) => item._id === response.data.chat?._id);
        return alreadyAdded ? items : [...items, response.data.chat];
      });
      setText('');

      // Fetch once immediately so both sides see the server-confirmed thread.
      await load(false);
    } catch (error) {
      setErr(error.response?.data?.message || 'Message failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-box ${compact ? 'chat-box-compact' : ''}`}>
      <div className="chat-header">
        <div>
          <i className="bi bi-chat-dots-fill me-2" />
          <b>Farmhouse inquiry</b>
        </div>
        <span className="small text-secondary">Live sync</span>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.length ? (
          messages.map((message) => {
            const isMine = String(message.sender?._id) === String(user?._id);
            return (
              <div
                key={message._id}
                className={`chat-message ${isMine ? 'outgoing' : 'incoming'}`}
              >
                <b>{message.sender?.name || 'User'}</b>
                <div>{message.message}</div>
                <small>{new Date(message.createdAt).toLocaleString('en-IN')}</small>
              </div>
            );
          })
        ) : (
          <div className="empty-state py-3 text-center">
            <i className="bi bi-chat-square-text fs-3" />
            <p className="small text-secondary mb-0 mt-2">
              Ask about availability, facilities, rules or location.
            </p>
          </div>
        )}
      </div>

      {err && <div className="small text-danger px-3 pb-2">{err}</div>}

      <form className="chat-input" onSubmit={send}>
        <input
          className="form-control"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your inquiry…"
          maxLength="2000"
          disabled={sending}
        />
        <button
          type="submit"
          className="btn btn-primary-custom rounded-pill px-3"
          disabled={sending || !text.trim()}
          title="Send message"
        >
          <i className={`bi ${sending ? 'bi-hourglass-split' : 'bi-send'}`} />
        </button>
      </form>
    </div>
  );
}
