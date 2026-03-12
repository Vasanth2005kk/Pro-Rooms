import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { profileAPI } from "../services/api";
import Navbar           from "../components/Navbar";
import RoomRow          from "../components/RoomRow";
import LoadingSpinner   from "../components/LoadingSpinner";
import CreateRoomModal  from "../components/CreateRoomModal";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("public");
  const [showCreate, setShowCreate] = useState(false);

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
      <style>{`
        .modal-section-title {
            border-bottom: 1px solid var(--glass-border);
            padding-bottom: 0.5rem;
            color: var(--text-main);
            font-weight: 600;
        }

        .input-group-text {
            min-width: 45px;
            justify-content: center;
            background-color: #10191E !important;
            color: #fff !important;
            border: 1px solid #3E505B !important;
            border-right: 0 !important;
            border-radius: 10px 0 0 10px !important;
            transition: var(--transition);
        }

        .input-group:focus-within .input-group-text {
            border-color: var(--primary) !important;
            color: var(--primary) !important;
        }

        input[type="file"]::file-selector-button {
            background-color: var(--primary);
            color: black !important;
            border: none;
            padding: 0.2rem 0.8rem;
            margin: 0.3rem 0.8rem 0.3rem 0;
            border-radius: 6px;
            cursor: pointer;
            transition: var(--transition);
            font-size: 0.8rem;
            font-weight: 600;
        }

        textarea[name="bio"] {
            min-height: 120px;
            resize: none;
        }
        
        .btn-star.starred i {
            color: #ffc107 !important;
        }
        .btn-star:hover i {
            color: #ffc107;
        }
      `}</style>
      <Navbar />
      <main className="">
        <div className="container-fluid profile-container px-md-5 mt-4">
          <div className="row g-md-5 d-flex justify-content-center">
            
            {/* Sidebar */}
            <div className="col-lg-4 col-md-4 profile-sidebar" style={{ marginTop: "10px", overflow: "hidden" }}>
              <div className="profile-img-container mb-3">
                <img
                  src={user.picture || "/static/images/userimages/default-avatar.png"}
                  alt="Profile"
                  className="profile-img-large"
                />
                <div className="mb-4 d-flex flex-column">
                  <h1 className="h3 mb-0 text-white fw-bold">{user.name || user.username || "Anonymous"}</h1>
                  <p className="text-muted fs-5 mb-1">
                    <span style={{ color: "var(--primary)" }}>@</span> {user.username || "no_username"}
                  </p>
                  {isOwnProfile && <p className="text-white-50 small mb-3">ID: PRO_{user.id + 1000}</p>}
                  
                  <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span className="text-white">Online</span>
                  </div>
                  
                  <div className="stats-row mt-2">
                    <a href="#" className="stat-item text-decoration-none">
                      <i className="fas fa-users me-1"></i>
                      <span className="stat-count text-white ms-1">{stats.followers || 0}</span>
                      <span className="text-muted ms-1">followers</span>
                    </a>
                    <span className="text-muted mx-1">·</span>
                    <a href="#" className="stat-item text-decoration-none">
                      <span className="stat-count text-white">10</span>
                      <span className="text-muted ms-1">following</span>
                    </a>
                  </div>
                </div>
              </div>

              {user.bio && <p className="mb-3 text-white p-3" style={{ fontSize: "1.4rem" }}>{user.bio}</p>}

              <div className="user-meta list-unstyled small mb-4 p-3" style={{ fontSize: "1.2rem" }}>
                {user.company && (
                  <div className="mb-2 text-white">
                    <i className="fas fa-building me-2 text-muted"></i>
                    {user.job_title || ""} <span style={{ color: "var(--primary)", fontSize: "1.5rem" }}>@</span> {user.company}
                  </div>
                )}
                
                {user.location && (
                  <div className="mb-2 text-white">
                    <i className="fas fa-map-marker-alt me-2 text-muted"></i> {user.location}
                  </div>
                )}
                
                {user.company_website && (
                  <div className="mb-2">
                    <i className="fas fa-globe me-2 text-muted"></i>
                    <a href={user.company_website.includes("http") ? user.company_website : `https://${user.company_website}`} className="text-decoration-none text-white" target="_blank" rel="noreferrer">
                      {user.company_website}
                    </a>
                  </div>
                )}

                {/* Optional Links block */}
                <div className="mt-3 d-flex flex-column gap-2">
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
                        <span className="small">{link.split("/").pop()}</span>
                      </a>
                    );
                  })}
                </div>

                {isOwnProfile && user.created_at && (
                  <div className="mt-3 text-white-50 small">
                    <i className="far fa-calendar-alt me-2 text-muted"></i> Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                )}
              </div>

              {isOwnProfile ? (
                <button className="btn btn-outline-light w-100 mb-3 py-2 fw-normal" onClick={() => alert("Inline React Profile Edit coming soon!")}>
                  Edit profile
                </button>
              ) : (
                <>
                  <button className="btn btn-primary w-100 mb-2 py-2 fw-bold">Follow</button>
                  <button className="btn btn-outline-light w-100 mb-3 py-2 fw-normal">Message</button>
                </>
              )}
            </div>

            {/* Main Content */}
            <div className="col-lg-7 col-md-8 pt-2" style={{ marginTop: "10px", overflowX: "hidden", position: "relative" }}>
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
                  <div className="d-flex justify-content-end align-items-center" style={{ position: "absolute", top: "5%", right: 0 }}>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                      <i className="fas fa-plus me-1"></i>New Room
                    </button>
                  </div>
                )}
              </nav>

              <div className="tab-content pt-3">
                {activeTab === "public" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {publicRooms.length > 0 ? (
                      publicRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => {}} onStar={() => {}} />)
                    ) : (
                      <EmptyState icon="fa-ghost" title="No public rooms" desc={`${isOwnProfile ? "You haven't" : `${user.name} hasn't`} created any public rooms yet.`} />
                    )}
                  </div>
                )}

                {activeTab === "private" && isOwnProfile && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {privateRooms.length > 0 ? (
                      privateRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => {}} onStar={() => {}} />)
                    ) : (
                      <EmptyState icon="fa-lock" title="No private rooms" desc="Private rooms are only visible to you." />
                    )}
                  </div>
                )}

                {activeTab === "joined" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {joinedRooms.length > 0 ? (
                      joinedRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => {}} onStar={() => {}} />)
                    ) : (
                      <EmptyState icon="fa-door-open" title="No joined rooms" desc="Rooms you join will appear here for easy access." />
                    )}
                  </div>
                )}

                {activeTab === "stars" && (
                  <div className="rooms-list d-flex flex-column gap-3">
                    {starredRooms.length > 0 ? (
                      starredRooms.map(r => <RoomRow key={r.id} room={r} onJoin={() => {}} onStar={() => {}} />)
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
    </>
  );
}
