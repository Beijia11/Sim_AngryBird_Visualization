// (4) Improve through validation: each .vrow plays its videos on one clock (the first video is the master).
// Starting one row pauses the others.
(() => {
  const rows = [...document.querySelectorAll('.vrow')].map(row => {
    const videos = [...row.querySelectorAll('video')], master = videos[0];
    const button = row.querySelector('.vplay'), seek = row.querySelector('.vseek'), time = row.querySelector('.vtime');
    let playing = false;
    const pause = () => { playing = false; videos.forEach(v => v.pause()); button.textContent = 'Play'; };
    const play = async () => {
      rows.forEach(r => r !== api && r.pause());
      if (master.ended || master.currentTime > master.duration - 0.05) videos.forEach(v => { v.currentTime = 0; });
      playing = true; button.textContent = 'Pause';
      await Promise.allSettled(videos.map(v => v.play()));
    };
    button.onclick = () => (playing ? pause() : play());
    seek.oninput = () => videos.forEach(v => { v.currentTime = +seek.value; });
    master.addEventListener('loadedmetadata', () => { seek.max = master.duration.toFixed(2); });
    master.addEventListener('ended', pause);
    const api = { pause, tick() {
      time.textContent = master.currentTime.toFixed(2) + ' s';
      if (document.activeElement !== seek) seek.value = master.currentTime;
      if (playing) for (const v of videos.slice(1))
        if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - master.currentTime) > 0.12) v.currentTime = master.currentTime;
    } };
    return api;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) rows.forEach(r => r.pause()); });
  (function frame() { rows.forEach(r => r.tick()); requestAnimationFrame(frame); })();
})();
