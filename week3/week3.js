'use strict';
/* Each iteration loads its game only when asked. The tennis builds carry a
   ~14 MB sprite payload, so nothing is fetched until the button is pressed. */

document.querySelectorAll('.play').forEach(play => {
  const frame = play.querySelector('iframe');
  const launcher = play.querySelector('.launcher');
  const start = play.querySelector('[data-start]');
  const stop = play.querySelector('[data-stop]');
  const status = play.querySelector('.status');
  let timeout;

  start.addEventListener('click', () => {
    launcher.hidden = true;
    frame.hidden = false;
    frame.style.pointerEvents = 'none';
    stop.hidden = false;
    status.textContent = 'Loading game…';
    frame.src = frame.dataset.src;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (status.textContent === 'Loading game…') {
        status.textContent = 'Still loading — the tennis builds carry ~14 MB of recorded frames.';
      }
    }, 8000);
  });

  stop.addEventListener('click', () => {
    clearTimeout(timeout);
    frame.src = 'about:blank';
    frame.hidden = true;
    stop.hidden = true;
    launcher.hidden = false;
    status.textContent = 'Game closed.';
    start.focus();
  });

  frame.addEventListener('load', () => {
    if (frame.getAttribute('src') !== 'about:blank' && !frame.hidden) {
      clearTimeout(timeout);
      frame.style.pointerEvents = '';
      status.textContent = 'Click inside the game to control it.';
    }
  });
});

/* Each embed measures itself and reports back, so the iframe is never a
   scrollbox inside the page. */
window.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'week3-game-size') return;
  for (const frame of document.querySelectorAll('.game-frame')) {
    if (event.source === frame.contentWindow && !frame.hidden &&
        Number.isFinite(event.data.height)) {
      frame.style.height = `${Math.max(280, Math.min(2200, Math.ceil(event.data.height)))}px`;
      break;
    }
  }
});
