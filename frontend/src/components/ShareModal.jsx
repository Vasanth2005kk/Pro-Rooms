import { useState } from "react";
import { getRoomShareUrl, shareRoom } from "../js/roomHelpers";

export default function ShareModal({ room, onClose }) {
  const url = getRoomShareUrl(room.id);
  const title = `Join "${room.name}" on Pro-Rooms`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy to clipboard.");
    }
  };

  const nativeShare = async () => {
    const result = await shareRoom(room);
    if (result === "copied") { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socials = [
    {
      name: "WhatsApp",
      icon: "fab fa-whatsapp",
      color: "#25D366",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "Twitter / X",
      icon: "fab fa-x-twitter",
      color: "#000",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: "fab fa-telegram",
      color: "#26A5E4",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "LinkedIn",
      icon: "fab fa-linkedin",
      color: "#0A66C2",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ backdropFilter: "blur(6px)" }}
        onClick={onClose}
      ></div>

      <div className="modal fade show d-block share-modal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
          <div className="modal-content">

            {/* Header */}
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h6 className="modal-title text-white mb-0 fw-bold">
                <i className="fas fa-share-nodes me-2 text-primary"></i>
                Share Room
              </h6>
              <button className="btn-close btn-close-white" onClick={onClose} style={{ margin: 0 }}></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {/* Room name hint */}
              <p className="text-white-50 small mb-3">
                <i className="fas fa-door-open me-1 text-primary"></i>
                <strong className="text-white">{room.name}</strong>
                {room.description && ` — ${room.description.slice(0, 60)}${room.description.length > 60 ? "…" : ""}`}
              </p>

              {/* URL bar */}
              <div className="share-url-box">
                <span className="share-url-text">{url}</span>
                <button
                  className={`btn-copy ${copied ? "copied" : ""}`}
                  onClick={copy}
                >
                  {copied
                    ? <><i className="fas fa-check me-1"></i>Copied!</>
                    : <><i className="far fa-copy me-1"></i>Copy</>
                  }
                </button>
              </div>

              {/* Social buttons */}
              <div className="social-grid">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className={s.icon} style={{ color: s.color }}></i>
                    <span>{s.name}</span>
                  </a>
                ))}
              </div>

              {/* Native share (mobile / Chrome) */}
              {navigator.share && (
                <button className="btn btn-native-share" onClick={nativeShare}>
                  <i className="fas fa-share-alt me-2"></i>Share via System…
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
