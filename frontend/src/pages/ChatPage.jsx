import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { chatAPI, roomsAPI } from "../services/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import "../css/chat.css";

export default function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);

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
        console.log("room :", room);
      }
    };
    init();
  }, [roomId]);

  /* ── WebSocket Connection ── */
  useEffect(() => {
    if (!roomId) return;

    // Connect through proxy
    const socket = io({
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to SocketIO server");
      socket.emit("join_room", { room_id: roomId });
    });

    socket.on("new_message", (msg) => {
      // Append message if it's not already in our list (to prevent duplicates)
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, {
          ...msg,
          is_me: msg.user_id === user?.id
        }];
      });
    });

    return () => {
      socket.emit("leave_room", { room_id: roomId });
      socket.disconnect();
    };
  }, [roomId, user?.id]);

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
      await chatAPI.postMessage(parseInt(roomId), content);
      // We don't append here anymore — the Socket listener will handle it!
      // This ensures timestamps/IDs are sync'd and no double-render flickers.
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



      <main className="p-0">
        <div className="chat-wrapper">
          <div className="chat-options">
            <button className="setting-icon" onClick={() => navigate(`/chat/${roomId}/settings`)}><i className="fa-solid fa-gear"></i></button>
          </div>
          {/* ── Sidebar (desktop) ── */}
          <div className="chat-sidebar d-none d-md-flex flex-column p-3">
            <div className="d-flex align-items-center mb-4">
              <Link to="/dashboard" className="btn btn-dark btn-sm me-3">
                <i className="fas fa-chevron-left"></i>
              </Link>
              <h4 className="mb-0">Rooms</h4>
            </div>

            <div className="room-info">
              <h5 className="text-primary said-name">{room?.name}</h5>
              <p className="text-white-50 ms-3 said-description" >{room?.description}</p>
              {room?.topic && room.topic.split(",").map((topic, index) => <span key={index} className="badge bg-secondary me-2 mb-2">{topic.trim()}</span>)}
            </div>

            <hr />

            <div className="members-list flex-grow-1">
              <h6 className="text-uppercase small text-white-50 mb-3">Online Now</h6>
              <div className="d-flex align-items-center mb-2">
                <div className="status-indicator online me-2"></div>
                <span>You</span>
              </div>
            </div>
{}
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

            {/* Input Area */}
            <div className="chat-input-area p-3">
              <div className="pill-left-icons">
                <button type="button" className="pill-icon-btn">
                  <i className="far fa-smile"></i>
                </button>
                <button type="button" className="pill-icon-btn">
                  <i className="fas fa-at"></i>
                </button>
              </div>
              <form id="chat-form" className="chat-form-pill" onSubmit={handleSend}>
                <input
                  type="text"
                  id="message-input"
                  className="pill-input"
                  placeholder="Ask anything"
                  autoComplete="off"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />

                <button type="submit" className="pill-send-btn" disabled={sending || !input.trim()}>
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
