import { useState } from "react";
import ShareModal from "./ShareModal";

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
          <div className="col-12 col-sm-8 d-flex align-items-center gap-3">
            <div className="room-avatar">
              <img
                src={room.icon || DEFAULT_ICON}
                alt={room.name}
                className="w-100 h-100 rounded-circle object-fit-cover"
                onError={(e) => { e.target.src = DEFAULT_ICON; }}
              />
            </div>
            <div>
              <h3 className="room-row-name">
                {room.name}
                <span className={`badge ms-2 ${room.privacy === "Public" ? "badge-public" : "badge-private"}`}>
                  <i className={`fas ${room.privacy === "Public" ? "fa-lock-open" : "fa-lock"} me-1`}></i>
                  {room.privacy}
                </span>
                {room.is_owner && (
                  <span
                    className="badge ms-2"
                    style={{ background: "rgba(255,193,7,.15)", color: "#ffc107", fontSize: "0.65rem" }}
                  >
                    <i className="fas fa-crown me-1"></i>Owner
                  </span>
                )}
              </h3>
              <small className="text-white-50 fw-bold d-flex align-items-center gap-1">
                ID : <span className="text-primary fw-bold" style={{ fontSize: "1rem" }}>{room.id}</span>
                <button className="copy-id-btn" onClick={copyId} title="Copy Room ID">
                  <i className="fas fa-copy"></i>
                </button>
              </small>
              <p className="room-row-desc mb-0 text-white-50 small">
                {room.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="badge-action col-12 col-sm-3 mt-2 mt-sm-0">
            <div className="d-flex gap-2 mb-2 flex-wrap">

              {/* Star */}
              <button
                className={`btn btn-sm btn-dark border border-secondary px-3 btn-star ${room.is_starred_by_me ? "starred" : ""}`}
                onClick={(e) => { e.stopPropagation(); if (onStar) onStar(); }}
                title={room.is_starred_by_me ? "Unstar" : "Star"}
              >
                <i className={`${room.is_starred_by_me ? "fas" : "far"} fa-star me-1`}></i>
                <span className="Star-count">{room.star_count}</span>
              </button>

              {/* Share — opens ShareModal */}
              <button
                className="btn btn-sm btn-dark border border-secondary px-3"
                onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                title="Share Room"
              >
                <i className="fas fa-share-nodes me-1 text-primary"></i>
              </button>

              {/* Owner-only: Edit
              {room.is_owner && onEdit && (
                <button
                  className="btn btn-sm btn-dark border border-warning px-3"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  title="Edit Room"
                >
                  <i className="fas fa-edit text-warning"></i>
                </button>
              )}

              {/* Owner-only: Delete 
              {room.is_owner && onDelete && (
                <button
                  className="btn btn-sm btn-dark border border-danger px-3"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="Delete Room"
                >
                  <i className="fas fa-trash-alt text-danger"></i>
                </button>
              )} */}

            </div>

            {/* Join */}
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              className="btn border border-secondary px-3 fw-bold btn-primary"
              style={{ width: "120px", padding: "7px" }}
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i>&nbsp;&nbsp;&nbsp;Join
            </button>
          </div>

          {/* Members */}
          <div className="room-member-count ms-auto col-sm-1">
            <span className="member-label">Members</span>
            <div className="member-inner">
              <i className="fa-solid fa-users text-primary"></i>
              <span className="text-white-50">
                1 <span className="text-primary fw-bold" style={{ fontSize: "1.1rem" }}>/</span> {room.usercount || 10}
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
