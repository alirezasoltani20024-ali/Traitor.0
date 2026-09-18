// کنترل‌های بازی
document.addEventListener('keydown', function(e) {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  if (key === 'z') {
    if (typeof window.doMission === 'function') window.doMission();
    else if (typeof window.gameMission === 'function') window.gameMission();
  }
  if (key === 'x') {
    if (typeof window.killPlayer === 'function') window.killPlayer();
    else if (typeof window.gameKill === 'function') window.gameKill();
  }
  if (key === 'c') {
    if (typeof window.callMeeting === 'function') window.callMeeting();
    else if (typeof window.gameMeeting === 'function') window.gameMeeting();
  }
});
