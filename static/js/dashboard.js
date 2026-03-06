/* =================================================
   Pro-Rooms  —  static/js/
   dashboard.js
================================================= */

let currentRoomId = null;
let joinTarget = 'whatsapp'; // 'chat' or 'whatsapp'

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

    const whatsappBtn = room.whatsapp_link
        ? `<button class="btn btn-row-whatsapp btn-sm" onclick="prepareJoin('${room.id}', '${room.name}', '${room.privacy}', 'whatsapp')">
                <i class="fab fa-whatsapp"></i>
           </button>`
        : '';

    return `
    <div class="room-row animate-slide-in" data-id="${room.id}">
        <div class="row align-items-center g-0 w-100">

            <!-- Left: Icon + Name + Meta -->
            <div class="col-12 col-sm-8 d-flex align-items-center gap-3">
                <div class="room-avatar">
                    <i class="fas fa-comments"></i>
                </div>
                <div>
                    <h3 class="room-row-name">${titleName}<span
                            class="badge ms-2 ${privacyBadgeClass}">
                            <i class="fas ${privacyIcon} me-1"></i>
                            ${room.privacy}
                        </span> </h3>
                    <small class="text-white-50 fw-bold d-flex align-items-center gap-1">
                        ID : <span class="text-primary fw-bold"
                            style="font-size: 1rem;">20264315233${room.id}</span>
                        <button class="copy-id-btn" onclick="copyRoomId(this, '${room.id}')"
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
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-dark border border-secondary px-3">
                        <i class="far fa-star me-1"></i> Star <span class="Star-count">5</span>
                    </button>
                </div>
                <button onclick="prepareJoin('${room.id}', '${room.name}', '${room.privacy}', 'chat')"
                    class="btn border border-secondary px-3 fw-bold btn-primary"
                    style="width: 120px;padding: 7px;">
                    <i class="fa-solid fa-arrow-right-to-bracket"></i>&nbsp;&nbsp;&nbsp;Join
                </button>
                ${whatsappBtn}
            </div>

            <!-- Member Count -->
            <div class="room-member-count ms-auto col-sm-1">
                <span class="member-label">Members</span>
                <div class="member-inner">
                    <i class="fa-solid fa-users text-primary"></i>
                    <span class="text-white-50">
                        125 <span class="text-primary fw-bold" style="font-size: 1.1rem;">/</span> 456
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

        const res = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            location.reload();
        } else {
            const err = await res.json();
            alert(err.error);
        }
    };
}

/* ─── Password / Join logic ─────────────────────── */
function prepareJoin(id, name, privacy, target = 'whatsapp') {
    currentRoomId = id;
    joinTarget = target;

    // Clear previous inputs
    document.querySelectorAll('.passcode-input').forEach(i => i.value = '');
    document.getElementById('joinError').textContent = '';

    if (privacy === 'Public') {
        if (target === 'chat') {
            window.location.href = `/chat/${id}`;
        } else {
            // For WhatsApp public links, we still call verifyRoom to get the link
            verifyRoom();
        }
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
                if (result.link) {
                    window.open(result.link, '_blank');
                } else {
                    alert('No WhatsApp link provided for this room.');
                }
            }
            bootstrap.Modal.getInstance(document.getElementById('joinRoomModal'))?.hide();
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
