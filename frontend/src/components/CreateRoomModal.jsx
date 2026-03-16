import { useRef, useState } from "react";
import { roomsAPI } from "../services/api";

export default function CreateRoomModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", description: "", topic: "",
    category: "Coding", privacy: "Public", password: "", members_limit: "20",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target.result);
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
      const { data } = await roomsAPI.create(fd);
      setSuccessData(data.room);
      onCreated(data.room);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <>
      <style>{`
        .create-room-modal .modal-content {
          background-color: #1A1D21 !important;
          border: 1px solid #2D3238 !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          overflow: hidden;
        }
        .create-room-modal .modal-header {
          border-bottom: 1px solid #2D3238 !important;
          padding: 1.25rem 1.5rem !important;
          background: #1A1D21 !important;
        }
        .create-room-modal .modal-body {
          padding: 1.5rem !important;
          background-color: #1A1D21 !important;
        }
        .create-room-modal .form-label {
          color: #8E96A0 !important;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .create-room-modal .input-group-text {
          background-color: #10191E !important;
          color: #fff !important;
          border: 1px solid #3E505B !important;
          border-right: 0 !important;
          border-radius: 10px 0 0 10px !important;
          min-width: 45px;
          justify-content: center;
        }
        .create-room-modal .form-control, 
        .create-room-modal .form-select {
          background-color: #10191E !important;
          border: 1px solid #3E505B !important;
          color: #fff !important;
          border-radius: 0 10px 10px 0 !important;
          padding: 0.6rem 0.75rem;
          transition: all 0.2s ease;
        }
        .create-room-modal .form-control:focus,
        .create-room-modal .form-select:focus {
          border-color: var(--primary) !important;
          box-shadow: none !important;
        }
        .create-room-modal .input-group:focus-within .input-group-text {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }
        .create-room-modal .modal-section-title {
          font-size: 1rem;
          color: #fff;
          margin-top: 1rem;
          margin-bottom: 1rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
        }
        .create-room-modal .room-avatar {
          transition: all 0.3s ease;
        }
        .create-room-modal .room-avatar:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: var(--primary) !important;
        }
        .create-room-modal .btn-create-submit {
          background-color: var(--primary) !important;
          border: none !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }
        .create-room-modal .members-adjust-btn {
          background: #10191E !important;
          border: 1px solid #3E505B !important;
          color: #8E96A0 !important;
          transition: all 0.2s ease;
        }
        .create-room-modal .members-adjust-btn:hover {
          color: #fff !important;
          background: #1a252b !important;
        }
      `}</style>

      <div className="modal-backdrop fade show" style={{ backdropFilter: "blur(8px)" }}></div>
      <div className="modal fade show d-block create-room-modal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h5 className="modal-title text-white mb-0">
                <i className="fas fa-plus-circle me-2"></i> Create New Community
              </h5>
              <div className="d-flex align-items-center gap-3">
                {!successData && (
                  <button type="submit" form="createRoomForm" className="btn btn-primary btn-sm px-4 btn-create-submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Room"}
                  </button>
                )}
                <button type="button" className="btn-close btn-close-white" onClick={onClose} style={{ margin: 0 }}></button>
              </div>
            </div>

            <div className="modal-body custom-scrollbar" style={{ maxHeight: "85vh", overflowY: "auto" }}>
              {error && <div className="alert alert-danger mx-3">{error}</div>}

              {!successData ? (
                <form id="createRoomForm" onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="row g-4 justify-content-center">
                    <div className="col-md-11">
                      <h6 className="modal-section-title">Basic Information</h6>
                    </div>

                    <div className="col-md-4 d-flex flex-column align-items-center justify-content-center">
                      <div
                        id="roomIconPreview"
                        className="room-avatar"
                        style={{
                          width: "120px", height: "120px", cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", border: `2px ${previewUrl ? "solid var(--primary)" : "dashed rgba(255,255,255,0.08)"}`, borderRadius: "50%",
                          overflow: "hidden", background: "rgba(255,255,255,0.05)"
                        }}
                        onClick={() => fileRef.current?.click()}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="fas fa-camera text-muted" style={{ fontSize: "1.2rem" }}></i>
                        )}
                      </div>
                      <input type="file" name="room_icon" id="roomIconInput" className="d-none" accept="image/*" ref={fileRef} onChange={handleFileChange} />
                      <label className="form-label text-muted mt-2">Group Icon</label>
                    </div>

                    <div className="col-md-7">
                      <div className="mb-3">
                        <label className="form-label">Group Name</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-heading"></i>
                          </span>
                          <input type="text" name="name" className="form-control" placeholder="e.g. Next.js Masters" required value={form.name} onChange={handleChange} />
                        </div>
                      </div>
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Category</label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fas fa-tag"></i>
                            </span>
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
                            <span className="input-group-text">
                              <i className="fas fa-hashtag"></i>
                            </span>
                            <input type="text" name="topic" className="form-control" placeholder="Nextjs, React" value={form.topic} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-11">
                      <label className="form-label">Group Description</label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ borderRadius: "10px 0 0 10px" }}>
                          <i className="fas fa-align-left"></i>
                        </span>
                        <textarea name="description" className="form-control" rows="3" placeholder="Describe your community..." style={{ minHeight: "80px" }} value={form.description} onChange={handleChange}></textarea>
                      </div>
                    </div>

                    <div className="col-md-11">
                      <h6 className="modal-section-title">Privacy & Access</h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Visibility (Privacy Type)</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-user-shield"></i>
                        </span>
                        <select name="privacy" className="form-select" value={form.privacy} onChange={handleChange}>
                          <option value="Public">Public (Anyone can join)</option>
                          <option value="Private">Private (Password required)</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <label className="form-label">Members Capacity</label>
                      <div className="input-group">
                        <button type="button" className="btn members-adjust-btn" onClick={() => setForm(p => ({ ...p, members_limit: Math.max(2, parseInt(p.members_limit || 0) - 1).toString() }))} style={{ borderRadius: "10px 0 0 10px" }}>
                          <i className="fas fa-minus"></i>
                        </button>
                        <input type="number" name="members_limit" className="form-control text-center bg-dark" value={form.members_limit} onChange={handleChange} style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }} />
                        <button type="button" className="btn members-adjust-btn" onClick={() => setForm(p => ({ ...p, members_limit: Math.min(5000, parseInt(p.members_limit || 0) + 1).toString() }))} style={{ borderRadius: "0 10px 10px 0" }}>
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {form.privacy === "Private" && (
                      <div className="col-md-11">
                        <label className="form-label">6-Digit Access Code</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-key"></i>
                          </span>
                          <input type="text" name="password" className="form-control" placeholder="123456" maxLength="6" pattern="\\d{6}" required value={form.password} onChange={handleChange} />
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div id="createSuccessContent" className="text-center py-5 animate-fade-in">
                  <div className="success-icon-container mb-4">
                    <i className="fas fa-check-circle text-success fa-5x"></i>
                  </div>
                  <h3 className="text-white fw-bold mb-2">Room Created Successfully!</h3>
                  <p className="text-white-50 mb-4">Your new community is ready for members.</p>

                  <div className="row justify-content-center">
                    <div className="col-md-10">
                      <div className="rounded-3 p-4 border border-secondary mb-4" style={{ background: "#10191E" }}>
                        <div className="mb-3">
                          <label className="text-muted small text-uppercase fw-bold d-block mb-2">Room Share Link</label>
                          <div className="input-group">
                            <input type="text" className="form-control bg-dark border-secondary text-primary" readOnly value={`${window.location.origin}/chat/${successData.id}`} />
                            <button className="btn btn-outline-primary" onClick={() => copyToClipboard(`${window.location.origin}/chat/${successData.id}`)}>
                              <i className="far fa-copy"></i>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-muted small text-uppercase fw-bold d-block mb-2">Room ID</label>
                          <div className="d-flex align-items-center justify-content-center gap-3">
                            <code className="fs-4 text-primary fw-bold">{successData.id}</code>
                            <button className="btn btn-sm btn-link text-primary p-0" onClick={() => copyToClipboard(successData.id)}>
                              <i className="far fa-copy"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button className="btn btn-primary w-100 py-3 fw-bold btn-create-submit" onClick={onClose}>
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
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
