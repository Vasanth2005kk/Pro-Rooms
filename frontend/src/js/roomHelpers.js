/**
 * src/js/roomHelpers.js
 * ─────────────────────
 * Shared helper functions for room-related actions.
 * Used by DashboardPage, ProfilePage, and any future page that renders RoomRows.
 *
 * All async helpers return a Promise so callers can await them if needed.
 */

import { roomsAPI } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// joinRoom
// Joins a room (auto-join public, password-prompt for private) then navigates.
// navigate  — React Router's navigate() function
// ─────────────────────────────────────────────────────────────────────────────
export async function joinRoom(room, navigate) {
  if (room.is_member || room.privacy === "Public") {
    if (!room.is_member) {
      try { await roomsAPI.join({ room_id: room.id }); } catch { }
    }
    navigate(`/chat/${room.id}`);
    return;
  }
  // Private — ask for password
  const password = window.prompt(`🔒 Enter 6-digit password for "${room.name}":`);
  if (password === null) return;
  try {
    await roomsAPI.join({ room_id: room.id, password });
    navigate(`/chat/${room.id}`);
  } catch (err) {
    alert(err.response?.data?.error || "Failed to join room.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// toggleStar
// Toggles star on a room and calls setRooms to update local state.
// setRooms  — React state setter that accepts a (prev) => next updater
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleStar(roomId, setRooms) {
  try {
    const { data } = await roomsAPI.toggleStar(roomId);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, is_starred_by_me: data.starred, star_count: data.star_count }
          : r
      )
    );
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteRoom
// Confirms then deletes a room. Calls onSuccess() if deletion succeeded.
// onSuccess — callback to run after deletion (e.g. filter list or refetch)
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteRoom(roomId, roomName, onSuccess) {
  if (!window.confirm(`Are you sure you want to permanently delete "${roomName}"?\nThis cannot be undone.`)) return;
  try {
    await roomsAPI.delete(roomId);
    onSuccess();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete room.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// shareRoom
// Opens the Web Share API if available, otherwise copies the link to clipboard.
// Returns a string: "shared" | "copied" | "error"
// ─────────────────────────────────────────────────────────────────────────────
export async function shareRoom(room) {
  const url   = `${window.location.origin}/chat/${room.id}`;
  const title = `Join "${room.name}" on Pro-Rooms`;
  const text  = room.description
    ? `${room.description}\n\nJoin here: ${url}`
    : `Join the room here: ${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      if (err.name !== "AbortError") {
        // Fall through to clipboard copy
      } else {
        return "aborted";
      }
    }
  }

  // Fallback — copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "error";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getRoomShareUrl
// Simple utility — returns the share URL for a room.
// ─────────────────────────────────────────────────────────────────────────────
export function getRoomShareUrl(roomId) {
  return `${window.location.origin}/chat/${roomId}`;
}
