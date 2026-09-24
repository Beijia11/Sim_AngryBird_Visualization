/* Keeps the four clips of a row playing as one. The first clip of each row is
   the master: the others are pulled back to its time whenever they drift by
   more than one frame. Rows outside the viewport are paused. */
(function () {
  'use strict';
  const FRAME = 1 / 24;

  document.querySelectorAll('.row').forEach(row => {
    const videos = Array.from(row.querySelectorAll('video'));
    if (!videos.length) return;
    const master = videos[0];

    const play = () => videos.forEach(v => v.play().catch(() => {}));
    const pause = () => videos.forEach(v => v.pause());
    const restart = () => { videos.forEach(v => { v.currentTime = 0; }); play(); };

    master.addEventListener('timeupdate', () => {
      videos.slice(1).forEach(v => {
        if (Math.abs(v.currentTime - master.currentTime) > FRAME * 2) {
          v.currentTime = master.currentTime;
        }
      });
    });
    master.addEventListener('seeking', () => {
      videos.slice(1).forEach(v => { v.currentTime = master.currentTime; });
    });

    const toggle = row.querySelector('[data-action="toggle"]');
    const again = row.querySelector('[data-action="restart"]');
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (master.paused) { play(); toggle.textContent = 'Pause'; }
        else { pause(); toggle.textContent = 'Play'; }
      });
    }
    if (again) again.addEventListener('click', restart);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          play();
          if (toggle) toggle.textContent = 'Pause';
        } else {
          pause();
          if (toggle) toggle.textContent = 'Play';
        }
      });
    }, { threshold: 0.25 });
    observer.observe(row);
  });
})();
