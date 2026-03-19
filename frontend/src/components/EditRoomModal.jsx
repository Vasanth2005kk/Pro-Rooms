import { useRef, useState } from "react";
import { roomsAPI } from "../services/api";
import "../css/editRoomModal.css";

/**
 * EditRoomModal
 * ─────────────
 * Styled identically to CreateRoomModal.
 * Props:
 *   room     — the current room object (pre-fills the form)
 *   onClose  — called when the modal is dismissed
 *   onUpdated(updatedRoom) — called with the fresh room data after a successful save
 */
export default function EditRoomModal({ room, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: room.name || "",
    description: room.description || "",
    topic: room.topic || "",
    category: room.category || "Coding",
    privacy: room.privacy || "Public",
    password: "",
    members_limit: String(room.usercount || 20),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(room.icon || null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setPreviewUrl(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (fileRef.current?.files[0]) {
      fd.append("room_icon", fileRef.current.files[0]);
    }

    try {
      const { data } = await roomsAPI.update(room.id, fd);
      setSaved(true);
      onUpdated(data.room);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ backdropFilter: "blur(8px)" }}></div>
      <div className="modal fade show d-block edit-room-modal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">

            {/* ── Header ── */}
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h5 className="modal-title text-white mb-0">
                <i className="fas fa-edit me-2"></i> Edit Community
              </h5>
              <div className="d-flex align-items-center gap-3">
                {!saved && (
                  <button
                    type="submit"
                    form="editRoomForm"
                    className="btn btn-primary btn-sm px-4 btn-edit-submit"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onClose}
                  style={{ margin: 0 }}
                ></button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="modal-body custom-scrollbar" style={{ maxHeight: "85vh", overflowY: "auto" }}>
              {error && <div className="alert alert-danger mx-3">{error}</div>}

              {!saved ? (
                <form id="editRoomForm" onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="row g-4 justify-content-center">

                    {/* Section title */}
                    <div className="col-md-11">
                      <h6 className="modal-section-title">Basic Information</h6>
                    </div>

                    {/* Icon picker */}
                    <div className="col-md-4 d-flex flex-column align-items-center justify-content-center">
                      <div
                        className="room-avatar-edit"
                        style={{
                          width: "120px", height: "120px", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: `2px ${previewUrl ? "solid var(--primary)" : "dashed rgba(255,255,255,0.15)"}`,
                          borderRadius: "50%", overflow: "hidden",
                          background: "rgba(255,255,255,0.05)",
                        }}
                        onClick={() => fileRef.current?.click()}
                        title="Click to change icon"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Icon preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="fas fa-camera text-muted" style={{ fontSize: "1.2rem" }}></i>
                        )}
                      </div>
                      <input
                        type="file"
                        name="room_icon"
                        className="d-none"
                        accept="image/*"
                        ref={fileRef}
                        onChange={handleFileChange}
                      />
                      <label className="form-label text-muted mt-2">Group Icon</label>
                    </div>

                    {/* Name + Category + Tags */}
                    <div className="col-md-7">
                      <div className="mb-3">
                        <label className="form-label">Group Name</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="fas fa-heading"></i></span>
                          <input
                            type="text" name="name" className="form-control"
                            placeholder="e.g. Next.js Masters"
                            required value={form.name} onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Category</label>
                          <div className="input-group">
                            <span className="input-group-text"><i className="fas fa-tag"></i></span>
                            <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                              <option value="Coding">Coding</option>
                              <option value="Business">Business</option>
                              <option value="Design">Design</option>
                              <option value="Student">Student</option>
                              <option value="Networking">Networking</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Tags</label>
                          <div className="input-group">
                            <span className="input-group-text"><i className="fas fa-hashtag"></i></span>
                            <input
                              type="text" name="topic" className="form-control"
                              placeholder="Nextjs, React"
                              value={form.topic} onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-md-11">
                      <label className="form-label">Group Description</label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ borderRadius: "10px 0 0 10px" }}>
                          <i className="fas fa-align-left"></i>
                        </span>
                        <textarea
                          name="description" className="form-control" rows="3"
                          placeholder="Describe your community..."
                          style={{ minHeight: "80px" }}
                          value={form.description} onChange={handleChange}
                        ></textarea>
                      </div>
                    </div>

                    {/* Privacy & Access section */}
                    <div className="col-md-11">
                      <h6 className="modal-section-title">Privacy &amp; Access</h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Visibility (Privacy Type)</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-user-shield"></i></span>
                        <select name="privacy" className="form-select" value={form.privacy} onChange={handleChange}>
                          <option value="Public">Public (Anyone can join)</option>
                          <option value="Private">Private (Password required)</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <label className="form-label">Members Capacity</label>
                      <div className="input-group">
                        <button
                          type="button"
                          className="btn members-adjust-btn"
                          style={{ borderRadius: "10px 0 0 10px" }}
                          onClick={() => setForm(p => ({ ...p, members_limit: Math.max(2, parseInt(p.members_limit || 0) - 1).toString() }))}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number" name="members_limit"
                          className="form-control text-center bg-dark"
                          value={form.members_limit} onChange={handleChange}
                          style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}
                        />
                        <button
                          type="button"
                          className="btn members-adjust-btn"
                          style={{ borderRadius: "0 10px 10px 0" }}
                          onClick={() => setForm(p => ({ ...p, members_limit: Math.min(5000, parseInt(p.members_limit || 0) + 1).toString() }))}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {form.privacy === "Private" && (
                      <div className="col-md-11">
                        <label className="form-label">6-Digit Access Code</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="fas fa-key"></i></span>
                          <input
                            type="text" name="password" className="form-control"
                            placeholder="Leave blank to keep existing code"
                            maxLength="6" pattern="\d{6}"
                            value={form.password} onChange={handleChange}
                          />
                        </div>
                        <small className="text-muted mt-1 d-block">
                          <i className="fas fa-info-circle me-1"></i>
                          Leave blank to keep the existing access code unchanged.
                        </small>
                      </div>
                    )}

                  </div>
                </form>
              ) : (
                /* ── Success state ── */
                <div className="text-center py-5 animate-fade-in">
                  <div className="mb-4">
                    <i className="fas fa-check-circle text-success fa-5x"></i>
                  </div>
                  <h3 className="text-white fw-bold mb-2">Room Updated Successfully!</h3>
                  <p className="text-white-50 mb-4">Your community settings have been saved.</p>
                  <button className="btn btn-primary px-5 py-2 fw-bold btn-edit-submit" onClick={onClose}>
                    <i className="fas fa-arrow-right me-2"></i> Done
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer border-0"></div>
          </div>
        </div>
      </div>
    </>
  );
}
