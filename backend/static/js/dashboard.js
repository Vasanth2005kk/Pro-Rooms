/* =================================================
   Pro-Rooms  —  static/js/
   dashboard.js
================================================= */

let currentRoomId = null;

/* ─── Copy Room ID to clipboard ─────────────────── */
function copyRoomId(btn, id) {
    navigator.clipboard.writeText(id).then(() => {
        const icon = btn.querySelector('i');
        // Switch to checkmark
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check');
        btn.classList.add('copied');

        // Revert after 1.5s
        setTimeout(() => {
            icon.classList.remove('fa-check');
            icon.classList.add('fa-copy');
            btn.classList.remove('copied');
        }, 1500);
    }).catch(() => {
        // Fallback for older browsers
        const temp = document.createElement('textarea');
        temp.value = id;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);

        const icon = btn.querySelector('i');
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check');
        btn.classList.add('copied');
        setTimeout(() => {
            icon.classList.remove('fa-check');
            icon.classList.add('fa-copy');
            btn.classList.remove('copied');
        }, 1500);
    });
}

/* ─── Share Link helpers ───────────────────────── */
function getRoomShareLink(roomId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/chat/${roomId}`;
}

function copyShareLink() {
    const link = document.getElementById('infoShareLink').value;
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.querySelector('[onclick="copyShareLink()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
        btn.classList.add('text-success');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('text-success');
        }, 2000);
    });
}

function copyShareLinkDirect(btn, event, roomId) {
    event.stopPropagation();
    const link = getRoomShareLink(roomId);
    navigator.clipboard.writeText(link).then(() => {
        const icon = btn.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fas fa-check me-1 text-success';
        const originalText = btn.innerHTML;
        
        setTimeout(() => {
            icon.className = originalClass;
        }, 1500);
    });
}

function copyCreatedShareLink() {
    const link = document.getElementById('successShareLink').value;
    navigator.clipboard.writeText(link).then(() => {
        alert('Share link copied!');
    });
}

function copyCreatedRoomId() {
    const id = document.getElementById('successRoomId').textContent;
    navigator.clipboard.writeText(id).then(() => {
        alert('Room ID copied!');
    });
}

/* ─── Privacy toggle for Create Room form ──────── */
const privacySelect = document.getElementById('privacySelect');
if (privacySelect) {
    privacySelect.addEventListener('change', function (e) {
        const passField = document.getElementById('passField');
        if (e.target.value === 'Private') {
            passField.classList.remove('d-none');
        } else {
            passField.classList.add('d-none');
        }
    });
}

/* ─── Build a single room row HTML ─────────────── */
function buildRoomRow(room) {
    const privacyBadgeClass = room.privacy === 'Public' ? 'badge-public' : 'badge-private';
    const privacyIcon = room.privacy === 'Public' ? 'fa-lock-open' : 'fa-lock';

    // Title case for name
    const titleName = room.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    return `
    <div class="room-row animate-slide-in" data-id="${room.id}" onclick="showRoomInfo('${room.id}')">
        <div class="row align-items-center g-0 w-100">

            <!-- Left: Icon + Name + Meta -->
            <div class="col-12 col-sm-8 d-flex align-items-center gap-3">
                <div class="room-avatar">
                   ${room.icon ? `<img src="${room.icon}" alt="${room.name}" class="w-100 h-100 rounded-circle object-fit-cover">` : `<i class="fas fa-comments"></i>`}
                </div>
                <div>
                    <h3 class="room-row-name">${titleName}<span
                            class="badge ms-2 ${privacyBadgeClass}">
                            <i class="fas ${privacyIcon} me-1"></i>
                            ${room.privacy}
                        </span> </h3>
                    <small class="text-white-50 fw-bold d-flex align-items-center gap-1">
                        ID : <span class="text-primary fw-bold"
                            style="font-size: 1rem;">${room.id}</span>
                        <button class="copy-id-btn" onclick="event.stopPropagation(); copyRoomId(this, '${room.id}')"
                            title="Copy Room ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </small>
                    <p class="room-row-desc mb-0 text-white-50 small">
                        ${room.description || 'No description provided.'}
                    </p>
                </div>
            </div>

            <!-- Right: Badge + Actions -->
            <div class="badge-action col-12 col-sm-3 mt-2 mt-sm-0">
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-sm btn-dark border border-secondary px-3 btn-star ${room.is_starred_by_me ? 'starred' : ''}" 
                            onclick="event.stopPropagation(); toggleStar(this, '${room.id}')">
                        <i class="${room.is_starred_by_me ? 'fas' : 'far'} fa-star me-1"></i> Star <span class="Star-count">${room.star_count || 0}</span>
                    </button>
                    <button class="btn btn-sm btn-dark border border-secondary px-3" 
                            onclick="copyShareLinkDirect(this, event, '${room.id}')" title="Share Room">
                        <i class="fas fa-share-nodes me-1 text-primary"></i> Share
                    </button>
                </div>
                <button onclick="event.stopPropagation(); prepareJoin('${room.id}', '${room.name}', '${room.privacy}', 'chat')"
                    class="btn border border-secondary px-3 fw-bold btn-primary"
                    style="width: 120px;padding: 7px;">
                    <i class="fa-solid ${room.is_member ? 'fa-door-open' : 'fa-arrow-right-to-bracket'}"></i>&nbsp;&nbsp;&nbsp;${room.is_member ? 'Enter' : 'Join'}
                </button>
            </div>

            <!-- Member Count -->
            <div class="room-member-count ms-auto col-sm-1">
                <span class="member-label">Members</span>
                <div class="member-inner">
                    <i class="fa-solid fa-users text-primary"></i>
                    <span class="text-white-50">
                        1 <span class="text-primary fw-bold" style="font-size: 1.1rem;">/</span> ${room.usercount}
                    </span>
                </div>
            </div>

        </div>
    </div>`;
}

/* ─── Search & Filter — fetch and re-render ─────── */
async function updateRooms() {
    const q = document.getElementById('roomSearch').value;
    const c = document.getElementById('categoryFilter').value;
    const p = document.getElementById('privacyFilter').value;

    const params = new URLSearchParams({ search: q, category: c, privacy: p });
    const res = await fetch(`/api/rooms?${params}`);
    const rooms = await res.json();

    const grid = document.getElementById('roomsGrid');

    if (rooms.length === 0) {
        grid.innerHTML = `
            <div class="empty-state text-center py-5">
                <i class="fas fa-search fa-3x text-white-50 mb-3"></i>
                <h5 class="text-white-50">No rooms found</h5>
                <p class="text-white-50 small">Try changing filters or create a new room.</p>
            </div>`;
    } else {
        grid.innerHTML = rooms.map(buildRoomRow).join('');
    }

    // Update counters
    const roomCount = document.getElementById('roomCount');
    if (roomCount) roomCount.textContent = rooms.length;

    const roomCountBadge = document.getElementById('roomCountBadge');
    if (roomCountBadge) roomCountBadge.textContent = `${rooms.length} Rooms`;
}

['roomSearch', 'categoryFilter', 'privacyFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateRooms);
});

/* ─── Create Room form submission ───────────────── */
const createRoomForm = document.getElementById('createRoomForm');
if (createRoomForm) {
    createRoomForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                body: new FormData(e.target)
            });

            const result = await res.json();
            if (res.ok) {
                // Hide form, show success state
                document.getElementById('createRoomForm').classList.add('d-none');
                document.querySelector('#createRoomModal .modal-header .btn-primary').classList.add('d-none'); // Hide create button in header
                document.querySelector('#createRoomModal .modal-header .modal-title').innerHTML = '<i class="fas fa-check-circle me-2 text-success"></i>Room Created';
                
                const room = result.room;
                document.getElementById('successRoomId').textContent = room.id;
                document.getElementById('successShareLink').value = getRoomShareLink(room.id);
                
                document.getElementById('createSuccessContent').classList.remove('d-none');
            } else {
                alert('Error creating room: ' + (result.error || 'Unknown error occurred'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to the server. Please try again.');
        }
    };
}

/* ─── Password / Join logic ─────────────────────── */
function prepareJoin(id, name, privacy, target = 'chat') {
    currentRoomId = id;
    joinTarget = target;

    // Clear previous inputs
    document.querySelectorAll('.passcode-input').forEach(i => i.value = '');
    document.getElementById('joinError').textContent = '';

    if (privacy === 'Public') {
        verifyRoom();
    } else {
        document.getElementById('joinRoomName').textContent = name;
        const modal = new bootstrap.Modal(document.getElementById('joinRoomModal'));
        modal.show();
    }
}

async function verifyRoom() {
    const inputs = document.querySelectorAll('.passcode-input');
    const passcode = Array.from(inputs).map(i => i.value).join('');

    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
        const res = await fetch('/api/rooms/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: currentRoomId, password: passcode })
        });

        const result = await res.json();
        if (result.success) {
            if (joinTarget === 'chat') {
                window.location.href = `/chat/${currentRoomId}`;
            } else {
                bootstrap.Modal.getInstance(document.getElementById('joinRoomModal'))?.hide();
            }
        } else {
            document.getElementById('joinError').textContent = result.error || 'Incorrect password';
            btn.disabled = false;
            btn.textContent = 'Unlock Room';
        }
    } catch (err) {
        document.getElementById('joinError').textContent = 'Connection error. Try again.';
        btn.disabled = false;
        btn.textContent = 'Unlock Room';
    }
}

/* ─── Auto-focus next passcode input ───────────── */
document.querySelectorAll('.passcode-input').forEach((input, idx, inputs) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && idx < 5) {
            inputs[idx + 1].focus();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
            inputs[idx - 1].focus();
        }
    });
});

/* ─── Room Information Modal ───────────────────── */
async function showRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const room = await response.json();
        
        if (response.ok) {
            document.getElementById('infoRoomId').textContent = room.id;
            document.getElementById('infoRoomName').textContent = room.name;
            document.getElementById('infoRoomIcon').src = room.icon || '/static/images/roomicons/default_roomicon.png';
            document.getElementById('infoRoomDescription').textContent = room.description || 'No description provided.';
            document.getElementById('infoRoomTopic').textContent = room.topic || 'General';
            document.getElementById('infoRoomCategory').textContent = room.category || 'Uncategorized';
            document.getElementById('infoRoomCreator').textContent = room.creator_name;
            document.getElementById('infoMemberCount').textContent = room.member_count;
            document.getElementById('infoStarCount').textContent = room.star_count;
            
            const date = new Date(room.created_at);
            document.getElementById('infoRoomDate').textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });

            const badge = document.getElementById('infoRoomPrivacyBadge');
            badge.className = room.privacy === 'Public' ? 'badge badge-public' : 'badge badge-private';
            badge.innerHTML = `<i class="fas ${room.privacy === 'Public' ? 'fa-lock-open' : 'fa-lock'} me-1"></i> ${room.privacy}`;

            document.getElementById('infoShareLink').value = getRoomShareLink(room.id);

            // Set Join button action
            const joinBtn = document.getElementById('infoJoinBtn');
            joinBtn.onclick = () => {
                bootstrap.Modal.getInstance(document.getElementById('roomInfoModal')).hide();
                prepareJoin(room.id, room.name, room.privacy, 'chat');
            };

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('roomInfoModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error fetching room info:', error);
    }
}

function copyInfoRoomId() {
    const id = document.getElementById('infoRoomId').textContent;
    navigator.clipboard.writeText(id).then(() => {
        alert('Room ID copied to clipboard!');
    });
}

/* ─── Star Toggle Logic ────────────────────────── */
async function toggleStar(btn, roomId) {
    try {
        const response = await fetch('/api/rooms/star', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ room_id: roomId })
        });
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('i');
            const countSpan = btn.querySelector('.Star-count');
            
            if (data.starred) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                btn.classList.add('starred');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                btn.classList.remove('starred');
            }
            countSpan.textContent = data.star_count;
        }
    } catch (error) {
        console.error('Error toggling star:', error);
    }
}
