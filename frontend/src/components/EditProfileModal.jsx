import { useRef, useState, useEffect } from "react";
import { profileAPI } from "../services/api";
import "../css/editprofileModal.css"

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
  const [fileName, setFileName] = useState("No file chosen");
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target.result);
      reader.readAsDataURL(file);
    } else {
      setFileName("No file chosen");
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
                    <div className="d-flex align-items-center gap-4">
                      {previewUrl && (
                        <div className="profile-preview-wrapper">
                          <img src={previewUrl} alt="Preview" className="profile-preview-img" />
                        </div>
                      )}
                      <div className="file-input-container flex-grow-1">
                        <div className="file-icon-box">
                          <i className="fas fa-image"></i>
                        </div>
                        <button type="button" className="btn-choose-file" onClick={() => fileRef.current?.click()}>
                          Choose File
                        </button>
                        <span className="file-name">{fileName}</span>
                        <input type="file" ref={fileRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                      </div>
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
