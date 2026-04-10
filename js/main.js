// js/main.js
import './firebase.js';                // تهيئة Firebase والمتغيرات العامة
import { initAuth, listenToUserData } from './auth.js';
import { updateUI, navTo, renderMap, renderShop, renderLeaderboard, renderDailyChallenge, renderStats, switchStatsTab } from './ui.js';
import { showToast, playSound, openModal, closeModal, showConfirmDialog, showInputDialog, confirmInput, cancelInput, confirmExit, _confirmExit, _cancelExit } from './helpers.js';
import { saveData, updateDailyTask, updateWeeklyTask, addSeasonXP, checkLevel, updateLoginStreak } from './data.js';
import { startQuiz, showQuestion, selectAnswer, nextQuestion, useHelper, askAIAnalysis } from './quiz.js';
import { createRoom, joinRoomByCode, joinRoomById, confirmCreateRoom, toggleReady, startRoomGame, leaveRoom, sendLobbyMessage, kickPlayer, loadRooms } from './rooms.js';
import { startDailyChallenge, renderWeeklyChallenge, renderSeasonTab, switchChallengeTab, claimWeeklyTask, startWeeklyChallenge } from './challenges.js';
import { showFriendsModal, copyFriendCode, addFriendByCode, removeFriend } from './friends.js';

// ══════════════════════════════════════════════════════════════════
// تعيين الدوال العامة على window (للاستخدام في HTML onclick)
// ══════════════════════════════════════════════════════════════════

// UI والتنقل
window.navTo = navTo;
window.updateUI = updateUI;
window.renderMap = renderMap;
window.renderShop = renderShop;
window.renderLeaderboard = renderLeaderboard;
window.renderDailyChallenge = renderDailyChallenge;
window.renderWeeklyChallenge = renderWeeklyChallenge;
window.renderSeasonTab = renderSeasonTab;
window.renderStats = renderStats;
window.switchStatsTab = switchStatsTab;
window.switchChallengeTab = switchChallengeTab;
window.switchLeaderboard = (tab) => renderLeaderboard(tab);

// المساعدات العامة
window.showToast = showToast;
window.playSound = playSound;
window.openModal = openModal;
window.closeModal = closeModal;
window.showConfirmDialog = showConfirmDialog;
window.showInputDialog = showInputDialog;
window._confirmInput = confirmInput;
window._cancelInput = cancelInput;
window._cancelConfirm = () => document.getElementById('cmod-confirm')?.classList.remove('active');
window.confirmExit = confirmExit;
window._confirmExit = _confirmExit;
window._cancelExit = _cancelExit;

// البيانات والحفظ
window.saveData = saveData;
window.updateDailyTask = updateDailyTask;
window.updateWeeklyTask = updateWeeklyTask;
window.addSeasonXP = addSeasonXP;
window.checkLevel = checkLevel;
window.updateLoginStreak = updateLoginStreak;

// الاختبار والأسئلة
window.startQuiz = startQuiz;
window.showQuestion = showQuestion;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.useHelper = useHelper;
window.askAIAnalysis = askAIAnalysis;

// الغرف والدردشة
window.createRoom = createRoom;
window.joinRoomByCode = joinRoomByCode;
window.joinRoomById = joinRoomById;
window.confirmCreateRoom = confirmCreateRoom;
window.toggleReady = toggleReady;
window.startRoomGame = startRoomGame;
window.leaveRoom = leaveRoom;
window.sendLobbyMessage = sendLobbyMessage;
window.kickPlayer = kickPlayer;
window.loadRooms = loadRooms;
window.openJoinRoomModal = () => openModal('join-room');

// التحديات
window.startDailyChallenge = startDailyChallenge;
window.startWeeklyChallenge = startWeeklyChallenge;
window.claimWeeklyTask = claimWeeklyTask;

// الأصدقاء
window.showFriendsModal = showFriendsModal;
window.copyFriendCode = copyFriendCode;
window.addFriendByCode = addFriendByCode;
window.removeFriend = removeFriend;

// دوال إضافية من المتجر والإعدادات
window.toggleSidebar = () => {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sb-overlay');
  const open = s.classList.toggle('open');
  o.style.display = open ? 'block' : 'none';
  if (open) {
    updateUI();
    // renderColorPicker موجودة في ui.js ويتم استدعاؤها عبر updateUI أو toggleSidebar
    if (typeof window.renderColorPicker === 'function') window.renderColorPicker();
  }
};

window.toggleSettings = () => {
  const panel = document.getElementById('settings-panel');
  const arrow = document.getElementById('settings-arrow');
  const dot = document.getElementById('settings-dot');
  const open = panel.classList.toggle('open');
  if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : '';
  if (dot) dot.style.opacity = open ? '1' : '0';
};

window.toggleTheme = () => {
  window.gameData.theme = window.gameData.theme === 'dark' ? 'light' : 'dark';
  updateUI();
  saveData();
};

window.toggleSound = () => {
  window.gameData.soundEnabled = !(window.gameData.soundEnabled !== false);
  updateUI();
  saveData();
  showToast(window.gameData.soundEnabled ? '🔊 الصوت مفعّل' : '🔇 الصوت مكتوم');
};

window.changeUsername = async () => {
  const name = await showInputDialog(window.gameData.username);
  if (name === null) return;
  if (name.length >= 3 && name.length <= 15) {
    window.gameData.username = name;
    await saveData();
    updateUI();
    showToast('✅ تم تغيير الاسم!');
  } else if (name.length > 0) {
    showToast('❌ الاسم يجب 3-15 حرفاً');
  }
};

window.saveMessageDebounced = () => {
  clearTimeout(window._msgDebounce);
  window._msgDebounce = setTimeout(() => {
    window.gameData.message = document.getElementById('my-message-input')?.value.trim() || '';
    saveData();
  }, 800);
};

window.showDailyTasksModal = () => {
  const d = window.gameData;
  let html = '';
  d.dailyTasks.forEach(t => {
    const pct = Math.min((t.current / t.goal) * 100, 100);
    html += `<div class="task-card ${t.claimed ? 'done' : ''}">
      <div class="task-top">
        <span class="task-text">${t.text}</span>
        <span class="task-badge ${t.claimed ? 'done-b' : 'pend-b'}">${t.claimed ? '✅ منجزة' : `+${t.reward} 💰`}</span>
      </div>
      <div class="task-prog">
        <div class="task-bar"><div class="task-fill ${t.claimed ? 'done-f' : ''}" style="width:${pct}%"></div></div>
        <span class="task-cnt">${t.current}/${t.goal}</span>
      </div>
    </div>`;
  });
  document.getElementById('tasks-body').innerHTML = html;
  openModal('tasks');
};

window.showAchievementsModal = () => {
  const d = window.gameData;
  const earned = d.achievements.filter(a => a.earned).length;
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:0 2px">
    <span style="font-size:13px;font-weight:700;color:var(--text2)">المفتوح</span>
    <span style="font-size:13px;font-weight:900;color:var(--accent)">${earned}/${d.achievements.length}</span>
  </div><div class="achv-grid">`;
  d.achievements.forEach(a => {
    html += `<div class="achv-card ${a.earned ? 'unlocked' : ''}">
      <div class="achv-icon ${a.earned ? 'earned' : 'locked'}">${a.earned ? a.icon : '🔒'}</div>
      <div><div class="achv-name">${a.text}</div>
      <div class="achv-status ${a.earned ? 'done' : 'locked'}">${a.earned ? '✦ مكتسب' : 'مغلق'}</div></div>
    </div>`;
  });
  document.getElementById('achv-body').innerHTML = html + '</div>';
  openModal('achv');
};

window.showPlayerCard = () => {
  const d = window.gameData;
  const season = window.getCurrentSeason?.() || '';
  const frame = (window.AVATAR_FRAMES || []).find(f => f.id === (d.avatarFrame || 'none')) || { style: '' };
  document.getElementById('player-card-content').innerHTML = `
    <div class="player-card">
      <div class="card-bg-glow"></div>
      <img src="${d.avatar}" class="card-avatar" style="${frame.style || ''}">
      <div class="card-name">${d.username}</div>
      <div style="text-align:center;margin-bottom:14px"><span class="card-rank">${d.rank}</span></div>
      <div class="card-stats">
        <div class="card-stat"><span class="card-stat-val">${d.level}</span><span class="card-stat-lbl">المستوى</span></div>
        <div class="card-stat"><span class="card-stat-val">${d.stats?.correctAnswers || 0}</span><span class="card-stat-lbl">صحيحة</span></div>
        <div class="card-stat"><span class="card-stat-val">${d.stats?.maxStreak || 0}</span><span class="card-stat-lbl">أعلى سلسلة</span></div>
      </div>
      <div class="card-season">
        <span class="card-season-label">🏅 موسم ${season}</span>
        <span class="card-season-val">${d.xp || 0} XP</span>
      </div>
      <div style="text-align:center;margin-top:12px;font-size:11px;font-weight:700;color:rgba(255,255,255,.3)">شغل مخك · Ultra 4.0</div>
    </div>`;
  openModal('card');
};

window.sharePlayerCard = async () => {
  const d = window.gameData;
  const text = `🧠 شغل مخك\n👤 ${d.username} · المستوى ${d.level}\n🏆 ${d.rank}\n⭐ ${d.xp} XP\n✅ ${d.stats?.correctAnswers || 0} إجابة صحيحة\n🔥 أعلى سلسلة: ${d.stats?.maxStreak || 0}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'بطاقتي في شغل مخك', text }); } catch (e) {}
  } else {
    await navigator.clipboard.writeText(text).catch(() => {});
    showToast('📋 تم نسخ البطاقة!');
  }
};

window.buyHelper = (price) => {
  if (window.gameData.coins < price) {
    showToast('❌ رصيدك غير كافٍ');
    return;
  }
  window.gameData.coins -= price;
  const amount = price >= 800 ? 10 : 3;
  window.gameData.inventory.delete += amount;
  window.gameData.inventory.hint += amount;
  window.gameData.inventory.skip += amount;
  playSound('snd-buy');
  try { confetti({ particleCount: 40, spread: 50 }); } catch (e) {}
  updateUI();
  saveData();
  showToast(`✅ تم الشراء! +${amount} لكل وسيلة`);
};

window.claimFreeCoins = () => {
  const today = new Date().toDateString();
  if (window.lastFreeCoinsDate === today) {
    showToast('⏰ عُد غداً!');
    return;
  }
  window.lastFreeCoinsDate = today;
  window.gameData.coins += 200;
  const btn = document.getElementById('btn-free-coins');
  if (btn) { btn.innerText = '✅ تم اليوم'; btn.disabled = true; }
  playSound('snd-buy');
  try { confetti({ particleCount: 80, spread: 60 }); } catch (e) {}
  updateUI();
  saveData();
  showToast('🎁 +200 عملة مجانية!');
};

window.handleFrameClick = (frame) => {
  const owned = frame.id === 'none' || (window.gameData.ownedFrames || []).includes(frame.id);
  if (owned) {
    window.gameData.avatarFrame = frame.id;
    updateUI();
    saveData();
    window.renderShop('frames');
    showToast(`✅ تم تفعيل إطار: ${frame.name}`);
  } else {
    if (window.gameData.coins < frame.price) {
      showToast('❌ رصيدك غير كافٍ');
      return;
    }
    showConfirmDialog({
      icon: '🖼️', title: 'شراء الإطار', msg: `${frame.name}\nالسعر: ${frame.price} 💰`,
      okText: 'شراء', okClass: 'ok',
      onOk: () => {
        window.gameData.coins -= frame.price;
        if (!window.gameData.ownedFrames) window.gameData.ownedFrames = [];
        window.gameData.ownedFrames.push(frame.id);
        window.gameData.avatarFrame = frame.id;
        playSound('snd-buy');
        try { confetti({ particleCount: 40, spread: 50 }); } catch (e) {}
        updateUI();
        saveData();
        window.renderShop('frames');
        showToast(`✅ تم شراء وتفعيل: ${frame.name}`);
      }
    });
  }
};

window.resetGame = () => {
  showConfirmDialog({
    icon: '🗑️', title: 'مسح البيانات', msg: 'سيتم تصفير كل شيء نهائياً\nهل أنت متأكد؟',
    okText: 'امسح كل شيء', okClass: 'danger',
    onOk: async () => {
      if (window.currentUser && window.db && window.firebaseReady) {
        try {
          await window.db_set(
            `artifacts/${window.appId}/users/${window.currentUser.uid}/profile/data`,
            { coins: 500, xp: 0, level: 1 }
          );
        } catch (e) { console.error(e); }
      }
      location.reload();
    }
  });
};

// ══════════════════════════════════════════════════════════════════
// بدء التطبيق
// ══════════════════════════════════════════════════════════════════
(async () => {
  await initAuth();
  listenToUserData();
  navTo('home');
})();

// إعدادات إضافية عند التحميل
window.addEventListener('load', () => {
  // يمكن إضافة أي تهيئة إضافية هنا
  console.log('🚀 شغل مخك Ultra 4.0 - تم تحميل التطبيق');
});
