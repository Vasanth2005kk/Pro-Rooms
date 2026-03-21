import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { chatAPI, roomsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import EditRoomModal from "../components/EditRoomModal";
import DeleteRoomModal from "../components/DeleteRoomModal";

export default function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  /* ── Initial load ── */
  useEffect(() => {
    const init = async () => {
      try {
        const [roomRes, msgRes] = await Promise.all([
          roomsAPI.get(parseInt(roomId)),
          chatAPI.getMessages(parseInt(roomId)),
        ]);
        setRoom(roomRes.data);
        setMessages(msgRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load chat.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [roomId]);

  /* ── Message polling every 3 s ── */
  useEffect(() => {
    if (!room) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await chatAPI.getMessages(parseInt(roomId));
        setMessages(data);
      } catch { }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [room, roomId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    try {
      const { data } = await chatAPI.postMessage(parseInt(roomId), content);
      setMessages((prev) => [...prev, {
        id: data.message.id,
        content: data.message.content,
        timestamp: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
        author_name: "You",
        is_me: true,
      }]);
    } catch (err) {
      alert(err.response?.data?.error || "Could not send message.");
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  /* ── Loading / error states ── */
  if (loading) return (
    <>
      <Navbar />
      <LoadingSpinner message="Loading chat…" />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="alert alert-danger m-4">
        <p>⚠️ {error}</p>
        <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />

      {/* ── Edit Room Modal (owner only) ── */}
      {showEdit && (
        <EditRoomModal
          room={room}
          onClose={() => setShowEdit(false)}
          onUpdated={(updatedRoom) => {
            setRoom((prev) => ({ ...prev, ...updatedRoom }));
          }}
        />
      )}

      {showDelete && (
        <DeleteRoomModal
          room={room}
          onClose={() => setShowDelete(false)}
          onDeleted={() => navigate("/dashboard")}
        />
      )}

      <main className="p-0">
        <div className="chat-wrapper">
          <div className="chat-options">
          </div>
          {/* ── Sidebar (desktop) ── */}
          <div className="chat-sidebar d-none d-md-flex flex-column p-3">
            <div className="d-flex align-items-center mb-4">
              <Link to="/dashboard" className="btn btn-dark btn-sm me-3">
                <i className="fas fa-chevron-left"></i>
              </Link>
              <h4 className="mb-0">Rooms</h4>
            </div>

            <div className="room-info mb-4">
              <h5 className="text-primary">{room?.name}</h5>
              <p className="text-white-50 small">{room?.description}</p>
              {room?.topic && <span className="badge bg-secondary mb-2">{room.topic}</span>}
            </div>

            <hr />

            <div className="members-list flex-grow-1">
              <h6 className="text-uppercase small text-white-50 mb-3">Online Now</h6>
              <div className="d-flex align-items-center mb-2">
                <div className="status-indicator online me-2"></div>
                <span>You</span>
              </div>
            </div>

            {/* Owner Tools — bottom of sidebar */}
            {room?.is_owner && (
              <div className="mt-auto pt-3 border-top border-secondary d-flex flex-column gap-2">
                <p className="text-muted small mb-1">
                  <i className="fas fa-crown me-1 text-warning"></i> Room Owner Tools
                </p>
                <button className="btn btn-sm btn-outline-light" onClick={() => setShowEdit(true)}>
                  <i className="fas fa-edit me-2"></i>Edit Room
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => setShowDelete(true)}>
                  <i className="fas fa-trash-alt me-2"></i>Delete Room
                </button>
              </div>
            )}
          </div>

          {/* ── Main Chat Area ── */}
          <div className="chat-main d-flex flex-column">

            {/* Header */}
            <div className="chat-header p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <button className="btn btn-link d-md-none text-white me-2 p-0" onClick={() => navigate("/dashboard")}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="room-avatar me-3">
                  <img src={room?.icon} alt={room?.name} className="w-100 h-100 rounded-circle object-fit-cover" />
                </div>
                <div>
                  <h5 className="mb-0">{room?.name}</h5>
                  <span className="text-success small">Active</span>
                </div>
              </div>

              <div className="header-actions d-flex align-items-center gap-1">
                {/* Mobile-only owner buttons */}
                {room?.is_owner && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-light d-md-none"
                      onClick={() => setShowEdit(true)}
                      title="Edit Room"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger d-md-none"
                      onClick={() => setShowDelete(true)}
                      title="Delete Room"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </>
                )}
                <button className="btn btn-link text-white-50">
                  <i className="fas fa-search"></i>
                </button>
                <button className="btn btn-link text-white-50">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container p-4 flex-grow-1" id="messages-container">
              {messages.length === 0 ? (
                <div className="text-center text-white-50 my-5">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.is_me ? "message-out" : "message-in"} animate-slide-up`}>
                    {!msg.is_me && <div className="small fw-bold text-primary mb-1">{msg.author_name}</div>}
                    <div className="message-text">{msg.content}</div>
                    <span className="message-meta">{msg.timestamp}</span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area p-3">
              <form id="chat-form" className="chat-form d-flex gap-2 align-items-center" onSubmit={handleSend}>
                <button type="button" className="btn btn-link text-white-50 p-0">
                  <i className="far fa-smile fa-lg"></i>
                </button>
                <button type="button" className="btn btn-link text-white-50 p-0">
                  <i className="fas fa-paperclip fa-lg"></i>
                </button>
                <div className="flex-grow-1 input-group">
                  <input
                    type="text"
                    id="message-input"
                    className="form-control chat-input"
                    placeholder="Type a message..."
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-send" disabled={sending}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
