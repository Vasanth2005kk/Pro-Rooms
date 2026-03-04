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

/* ─── Privacy toggle for Create Room form ──────── */
document.getElementById('privacySelect').addEventListener('change', function (e) {
    const passField = document.getElementById('passField');
    if (e.target.value === 'Private') {
        passField.classList.remove('d-none');
    } else {
        passField.classList.add('d-none');
    }
});

/* ─── Build a single room row HTML ─────────────── */
function buildRoomRow(room) {
    const privacyBadge = room.privacy === 'Public'
        ? `<span class="badge-public"><i class="fas fa-lock-open me-1"></i>Public</span>`
        : `<span class="badge-private"><i class="fas fa-lock me-1"></i>Private</span>`;

    const whatsappBtn = room.whatsapp_link
        ? `<button class="btn btn-row-whatsapp btn-sm" onclick="prepareJoin('${room.id}', '${room.name}', '${room.privacy}')">
                <i class="fab fa-whatsapp"></i>
           </button>`
        : '';

    return `
    <div class="room-row animate-slide-in" data-id="${room.id}">
        <div class="row align-items-center g-0 w-100">
            <div class="col-12 col-sm-5 d-flex align-items-center gap-3">
                <div class="room-avatar">
                    <i class="fas fa-comments"></i>
                </div>
                <div>
                    <h6 class="room-row-name mb-0">${room.name}</h6>
                    <small class="text-white-50 d-flex align-items-center gap-1">
                        ID : <span class="text-primary fw-bold">${room.id}</span>
                        <button class="copy-id-btn" onclick="copyRoomId(this, '${room.id}')" title="Copy Room ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </small>
                </div>
            </div>
            <div class="col-12 col-sm-4 px-2">
                <p class="room-row-desc mb-0 text-white-50 small text-truncate">
                    ${room.description || 'No description provided.'}
                </p>
            </div>
            <div class="col-12 col-sm-3 d-flex align-items-center justify-content-end gap-2 mt-2 mt-sm-0">
                ${privacyBadge}
                <a href="/chat/${room.id}" class="btn btn-row-chat btn-sm">
                    <i class="fas fa-comments me-1"></i> Chat
                </a>
                ${whatsappBtn}
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
    document.getElementById('roomCount').textContent = rooms.length;
    document.getElementById('roomCountBadge').textContent = `${rooms.length} Rooms`;
}

['roomSearch', 'categoryFilter', 'privacyFilter'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateRooms);
});

/* ─── Create Room form submission ───────────────── */
document.getElementById('createRoomForm').onsubmit = async (e) => {
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

/* ─── Password / Join logic ─────────────────────── */
function prepareJoin(id, name, privacy) {
    currentRoomId = id;
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
            window.open(result.link, '_blank');
            bootstrap.Modal.getInstance(document.getElementById('joinRoomModal'))?.hide();
        } else {
            document.getElementById('joinError').textContent = result.error || 'Incorrect password';
            btn.disabled = false;
            btn.textContent = 'Join';
        }
    } catch (err) {
        document.getElementById('joinError').textContent = 'Connection error. Try again.';
        btn.disabled = false;
        btn.textContent = 'Join';
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
