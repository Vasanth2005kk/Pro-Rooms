import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomsAPI } from "../services/api";
import { joinRoom, toggleStar, deleteRoom } from "../js/roomHelpers";
import Navbar from "../components/Navbar";
import RoomRow from "../components/RoomRow";
import LoadingSpinner from "../components/LoadingSpinner";
import CreateRoomModal from "../components/CreateRoomModal";
import DeleteRoomModal from "../components/DeleteRoomModal";
import "../css/dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [filters, setFilters] = useState({ search: "", category: "", privacy: "" });

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await roomsAPI.list(filters);
      setRooms(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchRooms, 250);
    return () => clearTimeout(timer);
  }, [fetchRooms]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleToggleStar = (roomId) => toggleStar(roomId, setRooms);

  const handleJoin = (room) => joinRoom(room, navigate);

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [{ ...newRoom, star_count: 0, is_starred_by_me: false, is_member: true, is_owner: true }, ...prev]);
  };

  return (
    <>
      <Navbar />
      <main className="">
        <div className="dashboard-container animate-fade-in">
          {/* Full 12-col Bootstrap Row */}
          <div className="row g-0 main-dash">

            {/* Left Sidebar */}
            <div className="col-12 col-md-3 sidebar-panel pe-md-3 mb-4 mb-md-0">
              <div className="glass-card p-4 h-100 d-flex flex-column gap-3">
                <div className="sidebar-brand text-center mb-2">
                  <div className="brand-icon mb-2">
                    <i className="fas fa-layer-group fa-2x text-primary"></i>
                  </div>
                  <h5 className="text-white fw-bold mb-0">Explore Rooms</h5>
                  <small className="text-white-50">Find your community</small>
                </div>

                <hr className="border-secondary" />

                {/* Filter logic wrapped smoothly inside */}
                <div className="sidebar-field">
                  <label className="sidebar-label">
                    <i className="fas fa-search me-1 text-primary"></i> Search
                  </label>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search rooms..."
                    className="form-control sidebar-input"
                    value={filters.search}
                    onChange={handleFilterChange}
                    autoComplete="off"
                  />
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    <i className="fas fa-tags me-1 text-primary"></i> Category
                  </label>
                  <select name="category" className="form-select sidebar-input" value={filters.category} onChange={handleFilterChange}>
                    <option value="">All Categories</option>
                    <option value="Coding">💻 Coding</option>
                    <option value="Business">💼 Business</option>
                    <option value="Design">🎨 Design</option>
                    <option value="Student">🎓 Student</option>
                    <option value="Networking">🌐 Networking</option>
                  </select>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    <i className="fas fa-lock me-1 text-primary"></i> Privacy
                  </label>
                  <select name="privacy" className="form-select sidebar-input" value={filters.privacy} onChange={handleFilterChange}>
                    <option value="">Any Privacy</option>
                    <option value="Public">🔓 Public</option>
                    <option value="Private">🔒 Private</option>
                  </select>
                </div>

                <hr className="border-secondary" />

                <button
                  className="btn btn-primary btn-create w-100 mt-auto"
                  onClick={() => setShowCreate(true)}
                >
                  <i className="fas fa-plus me-2"></i> Create Room
                </button>

                <div className="sidebar-stats text-center mt-2">
                  <small className="text-white-50">
                    <i className="fas fa-door-open me-1 text-primary"></i>
                    <span>{rooms.length}</span> rooms available
                  </small>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="col-12 col-md-8">
              <div className="col-11 mx-auto">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h4 className="text-white fw-bold mb-1">
                      <i className="fas fa-fire me-2 text-primary"></i>Active Rooms
                    </h4>
                    <small className="text-white-50">Browse and join live rooms</small>
                  </div>
                </div>

                <div id="roomsGrid" className="rooms-list d-flex flex-column gap-3">
                  {loading && <LoadingSpinner message="Loading rooms..." />}

                  {!loading && error && (
                    <div className="alert alert-danger p-3">{error}</div>
                  )}

                  {!loading && !error && rooms.length === 0 && (
                    <div className="empty-state text-center py-5">
                      <i className="fas fa-search fa-3x text-white-50 mb-3"></i>
                      <h5 className="text-white-50">No rooms found</h5>
                      <p className="text-white-50 small">Try changing filters or create a new room.</p>
                    </div>
                  )}

                  {!loading && !error && rooms.length > 0 &&
                    rooms.map((room) => (
                      <RoomRow
                        key={room.id}
                        room={room}
                        onStar={() => handleToggleStar(room.id)}
                        onJoin={() => handleJoin(room)}
                        onEdit={room.is_owner ? () => navigate(`/chat/${room.id}`) : undefined}
                        onDelete={room.is_owner ? () => setRoomToDelete(room) : undefined}
                      />
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={handleRoomCreated}
        />
      )}

      {roomToDelete && (
        <DeleteRoomModal
          room={roomToDelete}
          onClose={() => setRoomToDelete(null)}
          onDeleted={() => {
            setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
            setRoomToDelete(null);
          }}
        />
      )}
    </>
  );
}
