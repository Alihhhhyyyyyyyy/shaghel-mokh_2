// js/helpers.js
import { getCurrentSeason } from "./firebase.js";

// ─── TOAST (إشعارات منبثقة) ────────────────────────────────────────
export function showToast(msg, dur = 2800) {
  const c = document.getElementById("toast-container");
  if (!c) return;
  const el = document.createElement("div");
  el.className = "toast-msg";
  el.innerText = msg;
  c.appendChild(el);
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 350);
  }, dur);
}
window.showToast = showToast;

// ─── SOUND (تشغيل الأصوات) ─────────────────────────────────────────
export function playSound(id) {
  if (window.gameData?.soundEnabled === false) return;
  try {
    const s = document.getElementById(id);
    if (s) {
      s.currentTime = 0;
      s.play();
    }
  } catch (e) {}
}
window.playSound = playSound;

// ─── MODALS (النوافذ المنبثقة) ────────────────────────────────────────
export function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}
window.openModal = openModal;

export function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}
window.closeModal = closeModal;

// ─── CONFIRM DIALOG (حوار التأكيد) ────────────────────────────────────────────────
let _confirmResolve = null;
export function showConfirmDialog(opts) {
  const modal = document.getElementById("cmod-confirm");
  document.getElementById("cmod-ico").innerText = opts.icon || "⚠️";
  document.getElementById("cmod-ttl").innerText = opts.title || "هل أنت متأكد؟";
  document.getElementById("cmod-msg").innerText = opts.msg || "";
  const btn = document.getElementById("cmod-yes");
  btn.innerText = opts.okText || "تأكيد";
  btn.className = `cmod-btn ${opts.okClass || "danger"}`;
  btn.onclick = () => {
    modal.classList.remove("active");
    if (opts.onOk) opts.onOk();
  };
  modal.classList.add("active");
}
window.showConfirmDialog = showConfirmDialog;

export function cancelConfirm() {
  document.getElementById("cmod-confirm")?.classList.remove("active");
}
window._cancelConfirm = cancelConfirm;

// ─── INPUT DIALOG (حوار إدخال النص) ──────────────────────────────────────────────────
let _inputResolve = null;
export function showInputDialog(def = "") {
  return new Promise((resolve) => {
    _inputResolve = resolve;
    const modal = document.getElementById("cmod-input");
    const field = document.getElementById("cmod-inp-field");
    const hint = document.getElementById("cmod-inp-hint");
    field.value = def;
    hint.innerText = `${def.length} / 15 حرف`;
    modal.classList.add("active");
    setTimeout(() => field.focus(), 350);
  });
}
window.showInputDialog = showInputDialog;

export function confirmInput() {
  const field = document.getElementById("cmod-inp-field");
  const val = field.value.trim();
  document.getElementById("cmod-input").classList.remove("active");
  if (_inputResolve) {
    _inputResolve(val);
    _inputResolve = null;
  }
}
window._confirmInput = confirmInput;

export function cancelInput() {
  document.getElementById("cmod-input").classList.remove("active");
  if (_inputResolve) {
    _inputResolve(null);
    _inputResolve = null;
  }
}
window._cancelInput = cancelInput;

// ─── EXIT CONFIRM (تأكيد الخروج من الجولة) ──────────────────────────────────────────────────
export function confirmExit() {
  document.getElementById("cmod-exit").classList.add("active");
}
window.confirmExit = confirmExit;

export function _confirmExit() {
  document.getElementById("cmod-exit").classList.remove("active");
  if (window.timerInterval) clearInterval(window.timerInterval);
  window.navTo("map");
}
window._confirmExit = _confirmExit;

export function _cancelExit() {
  document.getElementById("cmod-exit").classList.remove("active");
}
window._cancelExit = _cancelExit;

// ─── ESCAPE HTML (للأمان في الدردشة) ───────────────────────────────────────────────────
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ─── OFFLINE SAVE QUEUE (حفظ البيانات في حالة الأوفلاين) ────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = "shaghel_offline_queue";

export function queueOfflineSave(data) {
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    queue.push({ data, ts: Date.now() });
    const trimmed = queue.slice(-3);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
  } catch (e) {}
}
window.queueOfflineSave = queueOfflineSave;

export async function syncOfflineQueue() {
  if (!window.firebaseReady || !window.currentUser) return;
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!queue.length) return;
    const last = queue[queue.length - 1];
    await window.db_set(
      `artifacts/${window.appId}/users/${window.currentUser.uid}/profile/data`,
      last.data,
      { merge: true }
    );
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log("[Offline] Synced queued save ✅");
  } catch (e) {
    console.warn("[Offline] Sync failed:", e);
  }
}
window.syncOfflineQueue = syncOfflineQueue;

window.addEventListener("online", () => {
  setTimeout(syncOfflineQueue, 2000);
});
