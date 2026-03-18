import { useRef, useState, useEffect } from "react";
import { profileAPI } from "../services/api";

export default function EditProfileModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    bio: user.bio || "",
    company: user.company || "",
    job_title: user.job_title || "",
    location: user.location || "",
    company_website: user.company_website || "",
    link1: user.link1 || "",
    link2: user.link2 || "",
    link3: user.link3 || "",
    link4: user.link4 || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.picture || null);
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
      fd.append("picture", fileRef.current.files[0]);
    }

    try {
      await profileAPI.update(user.username, fd);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .edit-profile-modal .modal-content {
          background-color: #1A1D21 !important;
          border: 1px solid #2D3238 !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
        }
        .edit-profile-modal .modal-header {
          border-bottom: 1px solid #2D3238 !important;
          padding: 1.25rem 1.5rem !important;
        }
        .edit-profile-modal .modal-body {
          padding: 1.5rem !important;
          background-color: #1A1D21 !important;
        }
        .edit-profile-modal .form-label {
          color: #8E96A0 !important;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .edit-profile-modal .input-group-text {
          background-color: #10191E !important;
          color: #fff !important;
          border: 1px solid #3E505B !important;
          border-right: 0 !important;
          border-radius: 10px 0 0 10px !important;
          min-width: 45px;
          justify-content: center;
        }
        .edit-profile-modal .form-control, 
        .edit-profile-modal .form-select {
          background-color: #10191E !important;
          border: 1px solid #3E505B !important;
          color: #fff !important;
          border-radius: 0 10px 10px 0 !important;
          padding: 0.6rem 0.75rem;
        }
        .edit-profile-modal .form-control:focus {
          border-color: #2ECC71 !important;
          box-shadow: none !important;
        }
        .edit-profile-modal .input-group:focus-within .input-group-text {
          border-color: #2ECC71 !important;
        }
        .edit-profile-modal textarea.form-control {
          border-radius: 10px !important;
          padding-left: 45px !important;
        }
        .edit-profile-modal .textarea-container {
          position: relative;
        }
        .edit-profile-modal .textarea-icon {
          position: absolute;
          left: 15px;
          top: 15px;
          color: #fff;
          z-index: 5;
        }
        .edit-profile-modal .btn-save {
          background-color: #1DB954 !important;
          border: none !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 0.4rem 1.5rem !important;
          border-radius: 8px !important;
        }
        .edit-profile-modal .btn-save:hover {
          background-color: #1AA34A !important;
        }
        .edit-profile-modal .modal-section-title {
          font-size: 1rem;
          color: #fff;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .edit-profile-modal .file-input-container {
          background-color: #10191E;
          border: 1px solid #3E505B;
          border-radius: 10px;
          padding: 0.4rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .edit-profile-modal .file-icon-box {
          min-width: 45px;
          display: flex;
          justify-content: center;
          color: #fff;
        }
        .edit-profile-modal .btn-choose-file {
          background-color: #2ECC71 !important;
          color: #000 !important;
          border: none !important;
          padding: 0.2rem 0.8rem !important;
          border-radius: 6px !important;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        .edit-profile-modal .file-name {
          color: #fff;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <div className="modal-backdrop fade show" style={{ backdropFilter: "blur(8px)" }}></div>
      <div className="modal fade show d-block edit-profile-modal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h5 className="modal-title text-white mb-0">
                <i className="fas fa-user-edit me-2"></i> Edit Profile
              </h5>
              <div className="d-flex align-items-center gap-3">
                <button type="submit" form="editProfileForm" className="btn btn-save" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="btn-close btn-close-white" onClick={onClose} style={{ margin: 0 }}></button>
              </div>
            </div>

            <div className="modal-body custom-scrollbar" style={{ maxHeight: "80vh", overflowY: "auto" }}>
              {error && <div className="alert alert-danger mb-4">{error}</div>}

              <form id="editProfileForm" onSubmit={handleSubmit}>
                <div className="row g-4">
                  {/* Name */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Name</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-id-card"></i>
                      </span>
                      <input type="text" name="name" className="form-control" placeholder="Your Name" value={form.name} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Username</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-at"></i>
                      </span>
                      <input type="text" name="username" className="form-control" placeholder="username" value={form.username} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="col-12" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Profile Picture</label>
                    <div className="file-input-container">
                      <div className="file-icon-box">
                        <i className="fas fa-image"></i>
                      </div>
                      <button type="button" className="btn-choose-file" onClick={() => fileRef.current?.click()}>
                        Choose File
                      </button>
                      <span className="file-name">
                        {fileRef.current?.files[0]?.name || "No file chosen"}
                      </span>
                      <input type="file" ref={fileRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="col-12" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Bio</label>
                    <div className="textarea-container">
                      <i className="fas fa-laptop textarea-icon"></i>
                      <textarea
                        name="bio"
                        className="form-control"
                        rows="4"
                        placeholder="Tell us about yourself..."
                        value={form.bio}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>

                  <div className="col-12" style={{ marginTop: "0px" }}>
                    <h6 className="modal-section-title">Corporate Profile</h6>
                    <hr className="border-secondary opacity-25" />
                  </div>

                  {/* Company */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Company</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-building"></i>
                      </span>
                      <input type="text" name="company" className="form-control" placeholder="Company Name" value={form.company} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Job Title</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-briefcase"></i>
                      </span>
                      <input type="text" name="job_title" className="form-control" placeholder="Job Title" value={form.job_title} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Location</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-map-marker-alt"></i>
                      </span>
                      <input type="text" name="location" className="form-control" placeholder="e.g. London, UK" value={form.location} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="col-md-6" style={{ marginTop: "0.5rem" }}>
                    <label className="form-label">Website</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-globe"></i>
                      </span>
                      <input type="text" name="company_website" className="form-control" placeholder="https://vglug.org/" value={form.company_website} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="col-12" style={{ marginTop: "0px" }}>
                    <h6 className="modal-section-title">Social Accounts</h6>
                    <hr className="border-secondary opacity-25" />
                  </div>

                  {/* Social Links */}
                  {[1, 2, 3, 4].map((num) => (
                    <div className="col-md-6" key={num} style={{ marginTop: "0.5rem" }}>
                      <label className="form-label">Link {num}</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-link"></i>
                        </span>
                        <input
                          type="text"
                          name={`link${num}`}
                          className="form-control"
                          placeholder="https://..."
                          value={form[`link${num}`]}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="modal-footer border-0"></div>
          </div>
        </div>
      </div>
    </>
  );
}
