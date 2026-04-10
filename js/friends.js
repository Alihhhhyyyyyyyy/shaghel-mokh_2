// js/friends.js
import { showToast } from './helpers.js';
import { saveData } from './data.js';
import { db, APP_ID } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ══════════════════════════════════════════════════════════════════
// توليد كود الصديق من معرف المستخدم
// ══════════════════════════════════════════════════════════════════
function generateFriendCode(uid) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[uid.charCodeAt(i % uid.length) % chars.length];
  }
  return code;
}

// ══════════════════════════════════════════════════════════════════
// عرض نافذة الأصدقاء
// ══════════════════════════════════════════════════════════════════
export function showFriendsModal() {
  const uid = window.currentUser?.uid;
  if (!uid) {
    showToast('❌ يلزم تسجيل الدخول');
    return;
  }
  const code = generateFriendCode(uid);
  window.gameData.friendCode = code;
  const codeEl = document.getElementById('my-friend-code');
  if (codeEl) codeEl.innerText = code;
  renderFriendsList();
  document.getElementById('modal-friends')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
window.showFriendsModal = showFriendsModal;

// ══════════════════════════════════════════════════════════════════
// نسخ كود الصديق إلى الحافظة
// ══════════════════════════════════════════════════════════════════
export async function copyFriendCode() {
  const code = window.gameData.friendCode || generateFriendCode(window.currentUser?.uid || 'x');
  try {
    await navigator.clipboard.writeText(code);
    showToast('📋 تم نسخ الكود: ' + code);
  } catch (e) {
    showToast('كودك: ' + code, 5000);
  }
}
window.copyFriendCode = copyFriendCode;

// ══════════════════════════════════════════════════════════════════
// إضافة صديق عن طريق الكود
// ══════════════════════════════════════════════════════════════════
export async function addFriendByCode() {
  const inputCode = document.getElementById('friend-code-input')?.value.trim().toUpperCase();
  if (!inputCode || inputCode.length < 6) {
    showToast('❌ أدخل الكود الصحيح');
    return;
  }
  if (!window.firebaseReady) {
    showToast('❌ يلزم اتصال');
    return;
  }

  const myCode = generateFriendCode(window.currentUser.uid);
  if (inputCode === myCode) {
    showToast('😄 ده كودك أنت!');
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'artifacts', APP_ID, 'public', 'data', 'rankings'));
    let found = null;
    snap.forEach(d => {
      const u = d.data();
      if (generateFriendCode(u.uid || d.id) === inputCode) found = u;
    });

    if (!found) {
      showToast('❌ لم يتم العثور على هذا اللاعب');
      return;
    }

    if (!window.gameData.friends) window.gameData.friends = [];
    const already = window.gameData.friends.some(f => f.uid === found.uid);
    if (already) {
      showToast('👥 هذا الشخص صديقك بالفعل!');
      return;
    }

    window.gameData.friends.push({
      uid: found.uid,
      username: found.username,
      level: found.level,
      addedAt: Date.now()
    });

    // تحديث إنجاز إضافة 3 أصدقاء
    const friendsCount = window.gameData.friends.length;
    if (friendsCount >= 3) {
      const ach = window.gameData.achievements.find(a => a.id === 'friend_3');
      if (ach && !ach.earned) {
        ach.earned = true;
        showToast('🤝 إنجاز: صديق وفيّ!', 4000);
      }
    }

    saveData();
    renderFriendsList();
    const inputField = document.getElementById('friend-code-input');
    if (inputField) inputField.value = '';
    showToast(`✅ أضفت ${found.username} كصديق!`);
  } catch (e) {
    showToast('❌ خطأ: ' + e.message);
  }
}
window.addFriendByCode = addFriendByCode;

// ══════════════════════════════════════════════════════════════════
// عرض قائمة الأصدقاء في النافذة
// ══════════════════════════════════════════════════════════════════
function renderFriendsList() {
  const list = document.getElementById('friends-list');
  if (!list) return;

  const friends = window.gameData.friends || [];
  if (!friends.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text2);font-weight:700;font-size:13px">
      <div style="font-size:36px;margin-bottom:8px">👥</div>لا يوجد أصدقاء بعد<br>
      <span style="font-size:11px;opacity:.6">شارك كودك مع أصحابك!</span>
    </div>`;
    return;
  }

  list.innerHTML = '';
  friends.forEach(f => {
    list.innerHTML += `<div style="background:var(--card);border:1px solid rgba(255,255,255,.06);
      border-radius:16px;padding:13px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
      <div style="width:42px;height:42px;border-radius:13px;background:rgba(251,191,36,.08);
        border:2px solid rgba(251,191,36,.2);display:flex;align-items:center;justify-content:center;
        font-size:16px;font-weight:900;color:var(--accent);font-family:'Tajawal',sans-serif;flex-shrink:0">
        ${(f.username || '؟').slice(0, 2)}
      </div>
      <div style="flex:1">
        <div style="font-weight:900;font-size:14px;color:#fff">${f.username || 'لاعب'}</div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-top:2px">مستوى ${f.level || 1}</div>
      </div>
      <button onclick="window.removeFriend('${f.uid}')"
        style="background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.15);
        border-radius:10px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;
        font-family:'Tajawal',sans-serif">إزالة</button>
    </div>`;
  });
}

// ══════════════════════════════════════════════════════════════════
// إزالة صديق
// ══════════════════════════════════════════════════════════════════
export function removeFriend(uid) {
  window.gameData.friends = (window.gameData.friends || []).filter(f => f.uid !== uid);
  saveData();
  renderFriendsList();
  showToast('تم إزالة الصديق');
}
window.removeFriend = removeFriend;
