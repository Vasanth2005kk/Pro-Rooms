import { useState } from "react";
import { roomsAPI } from "../services/api";

export default function DeleteRoomModal({ room, onClose, onDeleted }) {
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setError(null);
    setLoading(true);
    try {
      await roomsAPI.delete(room.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete room.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ backdropFilter: "blur(8px)", zIndex: 1050 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-danger" style={{ background: "var(--glass-bg)", border: "1px solid rgba(220, 53, 69, 0.4)" }}>
            <div className="modal-body custom-scrollbar p-0">
              {error && <div className="alert alert-danger m-3">{error}</div>}

              <div className="text-center py-5 animate-fade-in">
                <div className="mb-4">
                  <i className="fas fa-exclamation-triangle text-danger fa-5x"></i>
                </div>
                <h3 className="text-white fw-bold mb-2">Delete Room?</h3>
                <p className="text-white-50 mb-3">
                  Type the Room ID <strong className="user-select-all text-white">{room.id}</strong> to confirm deletion.
                </p>

                <div className="d-flex justify-content-center mb-4">
                  <input
                    type="text"
                    className="form-control text-center bg-dark text-white border-secondary"
                    placeholder={`Enter room ID to confirm`}
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    style={{ maxWidth: "250px" }}
                  />
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    className="btn btn-secondary px-4 py-2 fw-bold"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-4 py-2 fw-bold btn-edit-submit"
                    onClick={handleDelete}
                    disabled={loading || deleteConfirmInput !== String(room.id)}
                  >
                    <i className="fas fa-trash-alt me-2"></i> {loading ? "Deleting..." : "Delete Room"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
