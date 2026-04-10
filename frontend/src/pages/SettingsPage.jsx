import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import EditRoomModal from '../components/EditRoomModal';
import DeleteRoomModal from '../components/DeleteRoomModal';

export default function SettingsPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await roomsAPI.get(parseInt(roomId));
        setRoom(data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load room settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  if (loading) return (
    <>
      <Navbar />
      <LoadingSpinner message="Loading settings…" />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="alert alert-danger">
          ⚠️ {error}
          <button className="btn btn-link py-0 fw-bold" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />

      {/* ── Modals ── */}
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

      <div className="container mt-4 text-white">
        <div className="d-flex align-items-center mb-4">
          <button className="btn btn-outline-light btn-sm me-3" onClick={() => navigate(`/chat/${roomId}`)}>
            <i className="fas fa-chevron-left me-1"></i> Back to Chat
          </button>
          <h2 className="mb-0">Settings: <span className="text-primary">{room?.name}</span></h2>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card bg-dark text-white p-4 mb-4">
              <h5>General Settings</h5>
              <p className="text-muted">Options and preferences for this room will appear here.</p>
              {/* Future settings form can go here */}
            </div>
          </div>

          <div className="col-md-4">
            {/* Owner Tools — Moved from Chat Sidebar */}
            {room?.is_owner && (
              <div className="card bg-dark border-secondary p-3">
                <h6 className="text-muted small mb-3">
                  <i className="fas fa-crown me-1 text-warning"></i> Room Owner Tools
                </h6>
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-light" onClick={() => setShowEdit(true)}>
                    <i className="fas fa-edit me-2"></i>Edit Room Details
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => setShowDelete(true)}>
                    <i className="fas fa-trash-alt me-2"></i>Delete Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

