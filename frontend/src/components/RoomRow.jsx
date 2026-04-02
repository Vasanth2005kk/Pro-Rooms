import { useState } from "react";
import ShareModal from "./ShareModal";
import "../css/shareModal.css";
const DEFAULT_ICON = "/static/images/roomicons/default_roomicon.png";

export default function RoomRow({ room, onStar, onJoin, onEdit, onDelete }) {
  const [showShare, setShowShare] = useState(false);

  const copyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(room.id));
  };

  return (
    <>
      {showShare && (
        <ShareModal room={room} onClose={() => setShowShare(false)} />
      )}

      <div
        className="room-row animate-slide-in"
        data-id={room.id}
        onClick={(e) => { if (!e.target.closest("button")) onJoin(); }}
      >
        <div className="row align-items-center g-0 w-100">

          {/* Left: Icon + Name + Meta */}
          {/* Left: Icon + Name + Meta */}
          <div className="col-12 col-md-8 d-flex align-items-center gap-3">
            <div className="room-avatar flex-shrink-0">
              <img
                src={room.icon || DEFAULT_ICON}
                alt={room.name}
                className="w-100 h-100 rounded-circle object-fit-cover shadow-sm"
                onError={(e) => { e.target.src = DEFAULT_ICON; }}
              />
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                <h3 className="room-row-name mb-0">
                  {room.name}
                </h3>
                <span className={`badge ${room.privacy === "Public" ? "badge-public" : "badge-private"}`}>
                  <i className={`fas ${room.privacy === "Public" ? "fa-lock-open" : "fa-lock"} me-1`}></i>
                  {room.privacy}
                </span>
                {room.is_owner && (
                  <span
                    className="badge"
                    style={{ background: "rgba(255,193,7,.15)", color: "#ffc107", fontSize: "0.65rem" }}
                  >
                    <i className="fas fa-crown me-1"></i>Owner
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center gap-3">
                <small className="text-white-50 fw-bold d-flex align-items-center gap-1">
                  ID: <span className="text-primary fw-bold">{room.id}</span>
                  <button className="copy-id-btn" onClick={copyId} title="Copy Room ID">
                    <i className="fas fa-copy"></i>
                  </button>
                </small>
                {/* Members - shown next to ID on mobile */}
                <div className="room-member-count-sm d-md-none">
                  <i className="fa-solid fa-users text-primary me-1"></i>
                  <span className="text-white-50 small">{room.usercount || 10}</span>
                </div>
              </div>

              <p className="room-row-desc mb-0 text-white-50 small text-truncate d-none d-md-block">
                {room.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Actions & Stats Desktop */}
          <div className="badge-action col-12 col-md-4 mt-3 mt-md-0 d-flex flex-row flex-md-column align-items-center align-items-md-end justify-content-between justify-content-md-center gap-3">
            <div className="d-flex gap-2 align-items-center">
              {/* Star */}
              <button
                className={`btn btn-sm btn-dark border border-secondary px-3 btn-star ${room.is_starred_by_me ? "starred" : ""}`}
                onClick={(e) => { e.stopPropagation(); if (onStar) onStar(); }}
                title={room.is_starred_by_me ? "Unstar" : "Star"}
              >
                <i className={`${room.is_starred_by_me ? "fas" : "far"} fa-star me-1`}></i>
                <span className="Star-count">{room.star_count}</span>
              </button>

              {/* Share */}
              <button
                className="btn btn-sm btn-dark border border-secondary px-3"
                onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                title="Share Room"
              >
                <i className="fas fa-share-nodes me-1 text-primary"></i>
              </button>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Members Desktop */}
              <div className="room-member-count d-none d-md-flex">
                <span className="member-label">Members</span>
                <div className="member-inner">
                  <i className="fa-solid fa-users text-primary"></i>
                  <span className="text-white-50">
                    {room.usercount || 10}
                  </span>
                </div>
              </div>

              {/* Join */}
              <button
                onClick={(e) => { e.stopPropagation(); onJoin(); }}
                className="btn border border-secondary px-4 fw-bold btn-primary btn-join-room"
              >
                Join
                <i className="fa-solid fa-arrow-right-to-bracket ms-2"></i>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
