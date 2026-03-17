import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { profileAPI } from "../services/api";
import Navbar from "../components/Navbar";
import RoomRow from "../components/RoomRow";
import LoadingSpinner from "../components/LoadingSpinner";
import CreateRoomModal from "../components/CreateRoomModal";
import EditProfileModal from "../components/EditProfileModal";
import "../css/profile.css";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("public");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await profileAPI.get(username);
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.error || "Profile not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleProfileUpdated = async () => {
    try {
      const { data } = await profileAPI.get(username);
      setProfile(data);
    } catch (err) {
      console.error("Failed to refresh profile", err);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <LoadingSpinner message="Loading profile..." />
    </>
  );

  if (error || !profile) return (
    <>
      <Navbar />
      <div className="alert alert-danger m-4 text-center">
        <h4>{error || "User not found"}</h4>
        <Link to="/dashboard" className="btn btn-primary mt-3">Back to Dashboard</Link>
      </div>
    </>
  );

  const { user, stats, rooms } = profile;
  const isOwnProfile = currentUser?.id === user.id;

  const publicRooms = rooms.public || [];
  const privateRooms = rooms.private || [];
  const joinedRooms = rooms.joined || [];
  const starredRooms = rooms.starred || [];

  const handleRoomCreated = (newRoom) => {
    // Only fetch again or append dynamically
    window.location.reload();
  };

  const EmptyState = ({ icon, title, desc }) => (
    <div className="glass-card p-5 text-center border border-secondary">
      <i className={`fas ${icon} fa-3x mb-3 text-muted`}></i>
      <h5 className="text-white">{title}</h5>
      <p className="text-muted">{desc}</p>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="pb-5">
        <div className="container-fluid profile-container px-md-5">
          <div className="row g-md-5 d-flex justify-content-center">

            {/* Sidebar */}
            <div className="col-lg-4 col-md-4">
              <div className="profile-sidebar">
                <div className="profile-img-container mb-3 text-center text-md-start">
                  <img
                    src={user.picture || "/static/images/userimages/default-avatar.png"}
                    alt="Profile"
                    className="profile-img-large mx-auto mx-md-0"
                  />
                  <div className="mb-4 d-flex flex-column">
                    <h1 className="h3 mb-0 text-white fw-bold">{user.name || user.username || "Anonymous"}</h1>
                    <p className="text-muted fs-5 mb-1">
                      <span style={{ color: "#28a745" }}>@</span> {user.username || "no_username"}
                    </p>
                    {isOwnProfile && <p className="text-white-50 small mb-3">ID: PRO_{user.id + 1000}</p>}

                    <div className="status-indicator">
                      <div className="status-dot"></div>
                      <span className="text-white">Online</span>
                    </div>

                    <div className="stats-row mt-3">
                      <a href="#" className="stat-item text-decoration-none">
                        <i className="fas fa-users me-1 text-muted"></i>
                        <span className="stat-count text-white fw-bold">{stats.followers || 0}</span>
                        <span className="text-muted ms-1">followers</span>
                      </a>
                      <span className="text-muted mx-1">·</span>
                      <a href="#" className="stat-item text-decoration-none">
                        <span className="stat-count text-white fw-bold">10</span>
                        <span className="text-muted ms-1">following</span>
                      </a>
                    </div>
                  </div>
                </div>

                {user.bio && <p className="profile-bio">{user.bio}</p>}

                <div className="user-meta">
                  {user.company && (
                    <div className="meta-item">
                      <i className="fas fa-building"></i>
                      <span>
                        {user.job_title || ""} <span style={{ color: "var(--primary)" }}>@</span> {user.company}
                      </span>
                    </div>
                  )}

                  {user.location && (
                    <div className="meta-item">
                      <i className="fas fa-map-marker-alt"></i> <span>{user.location}</span>
                    </div>
                  )}

                  {user.company_website && (
                    <div className="meta-item">
                      <i className="fas fa-globe"></i>
                      <a href={user.company_website.includes("http") ? user.company_website : `https://${user.company_website}`} className="text-decoration-none text-white hover-primary" target="_blank" rel="noreferrer">
                        {user.company_website}
                      </a>
                    </div>
                  )}

                  {/* Links section */}
                  <div className="mt-2 d-flex flex-column gap-2">
                    {[user.link1, user.link2, user.link3, user.link4].map((link, i) => {
                      if (!link) return null;
                      const l = link.toLowerCase();
                      const url = l.includes("http") ? link : `https://${link}`;
                      const iconClass = l.includes("github") ? "fa-github"
                        : l.includes("linkedin") ? "fa-linkedin"
                          : l.includes("instagram") ? "fa-instagram"
                            : l.includes("facebook") ? "fa-facebook"
                              : (l.includes("twitter") || l.includes("x.com")) ? "fa-x-twitter" : "fa-link";

                      return (
                        <a key={i} href={url} className="text-white user-links text-decoration-none d-flex align-items-center gap-2" target="_blank" rel="noreferrer">
                          <i className={`fab ${iconClass} fa-lg`}></i>
                          <span className="small text-truncate">{link.split("/").pop() || link}</span>
                        </a>
                      );
                    })}
                  </div>

                  {isOwnProfile && user.created_at && (
                    <div className="joined-date">
                      <i className="far fa-calendar-alt me-2 text-muted"></i>
                      Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isOwnProfile ? (
                    <button className="btn btn-outline-light w-100 py-2 fw-normal" onClick={() => setShowEdit(true)}>
                      <i className="fas fa-edit me-2"></i>Edit profile
                    </button>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      <button className="btn btn-primary w-100 py-2 fw-bold">Follow</button>
                      <button className="btn btn-outline-light w-100 py-2 fw-normal">Message</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-lg-7 col-md-8 profile-main-content">
              <nav className="profile-nav-tabs">
                <button className={`nav-tab-item ${activeTab === "public" ? "active" : ""} bg-transparent border-0`} onClick={() => setActiveTab("public")}>
                  <i className="fa-solid fa-unlock"></i> Public <span className="tab-badge">{publicRooms.length}</span>
                </button>

                {isOwnProfile && (
                  <button className={`nav-tab-item ${activeTab === "private" ? "active" : ""} bg-transparent border-0`} onClick={() => setActiveTab("private")}>
                    <i className="fa-solid fa-lock"></i> Private <span className="tab-badge">{privateRooms.length}</span>
                  </button>
                )}

                <button className={`nav-tab-item ${activeTab === "joined" ? "active" : ""} bg-transparent border-0`} onClick={() => setActiveTab("joined")}>
                  <i className="fa-solid fa-plug-circle-check"></i> Joined <span className="tab-badge">{joinedRooms.length}</span>
                </button>

                <button className={`nav-tab-item ${activeTab === "stars" ? "active" : ""} bg-transparent border-0`} onClick={() => setActiveTab("stars")}>
                  <i className="fas fa-star"></i> Stars <span className="tab-badge">{starredRooms.length}</span>
                </button>

                {isOwnProfile && (
                  <div className="new-room-btn-container">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                      <i className="fas fa-plus me-1"></i>New Room
                    </button>
                  </div>
                )}
              </nav>

              <div className="tab-content">
                {activeTab === "public" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {publicRooms.length > 0 ? (
                      publicRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => { }} onStar={() => { }} />)
                    ) : (
                      <EmptyState icon="fa-ghost" title="No public rooms" desc={`${isOwnProfile ? "You haven't" : `${user.name} hasn't`} created any public rooms yet.`} />
                    )}
                  </div>
                )}

                {activeTab === "private" && isOwnProfile && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {privateRooms.length > 0 ? (
                      privateRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => { }} onStar={() => { }} />)
                    ) : (
                      <EmptyState icon="fa-lock" title="No private rooms" desc="Private rooms are only visible to you." />
                    )}
                  </div>
                )}

                {activeTab === "joined" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {joinedRooms.length > 0 ? (
                      joinedRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => { }} onStar={() => { }} />)
                    ) : (
                      <EmptyState icon="fa-door-open" title="No joined rooms" desc="Rooms you join will appear here for easy access." />
                    )}
                  </div>
                )}

                {activeTab === "stars" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {starredRooms.length > 0 ? (
                      starredRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => { }} onStar={() => { }} />)
                    ) : (
                      <EmptyState icon="fa-star" title="No starred rooms" desc="Rooms you star will appear here for quick access." />
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleRoomCreated} />}
      {showEdit && <EditProfileModal user={user} onClose={() => setShowEdit(false)} onUpdated={handleProfileUpdated} />}
    </>
  );
}
