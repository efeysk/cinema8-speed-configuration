// Bilerek video yerine vidyo yazdım çok şey yapma :Dd

(() => {
  if (window.__c8tools) return;
  window.__c8tools = true;

  let speed = 1;
  const vercekisimbulamadim = 0.25;
  const enaz = 0.0625;
  const enfazla = 32;

  const vidyoyucek = () => [...document.querySelectorAll('video')];
  const anavidyo = () => {
    const v = vidyoyucek();
    return v.find(x => !x.paused) ||
      [...v].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
  };

  function hiziayarla(val) {
    speed = Math.min(enfazla, Math.max(enaz, Math.round(val * 100) / 100));
    vidyoyucek().forEach(v => { try { v.playbackRate = speed; } catch (e) {} });
    if (input) input.value = speed;
    try { chrome.storage.local.set({ c8speed: speed }); } catch (e) {}
  }

  function tekrarvidoyaekle(v) {
    if (v.__c8hooked) return;
    v.__c8hooked = true;
    v.addEventListener('ratechange', () => {
      if (Math.abs(v.playbackRate - speed) > 0.001) {
        try { v.playbackRate = speed; } catch (e) {}
      }
    });
    v.addEventListener('loadedmetadata', () => { try { v.playbackRate = speed; } catch (e) {} });
    try { v.playbackRate = speed; } catch (e) {}
  }

  const cartcurtbiseyler = t => {
    const s = Math.floor(t);
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
      .map(n => String(n).padStart(2, '0')).join('-');
  };

  function ssal() {
    const v = anavidyo();
    if (!v || !v.videoWidth) return toast('Video bulunamadı');
    try {
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(blob => {
        if (!blob) return toast('Görüntü alınamadı');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cinema8-${cartcurtbiseyler(v.currentTime)}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('Ekran görüntüsü kaydedildi');
      }, 'image/png');
    } catch (e) {
      toast('Bu video görüntü almaya izin vermiyor');
    }
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:8px;left:8px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      .p{display:flex;gap:4px;align-items:center;background:rgba(20,20,20,.85);
         color:#fff;font:12px system-ui,sans-serif;padding:4px 6px;border-radius:8px;
         opacity:.25;transition:opacity .15s}
      .p:hover{opacity:1}
      button{background:#333;color:#fff;border:0;border-radius:5px;padding:3px 7px;cursor:pointer;font:inherit}
      button:hover{background:#555}
      input{width:52px;background:#111;color:#fff;border:1px solid #444;border-radius:5px;
            padding:2px 4px;font:inherit;text-align:center}
      .t{position:absolute;top:34px;left:0;background:#111;color:#fff;padding:3px 8px;
         border-radius:5px;font:12px system-ui;white-space:nowrap;opacity:0;transition:opacity .2s}
      .t.on{opacity:1}
    </style>
    <div class="p">
      <button id="m" title="Yavaşlat (Alt+↓)">−</button>
      <input id="s" type="number" step="0.25" min="0.0625" max="32" value="1">
      <button id="a" title="Hızlandır (Alt+↑)">+</button>
      <button id="r" title="1x'e dön (Alt+0)">1x</button>
      <button id="c" title="Ekran görüntüsü (Alt+S)">📷</button>
    </div>
    <div class="t" id="t"></div>`;
  const input = root.getElementById('s');
  const tip = root.getElementById('t');
  let tipTimer;
  function toast(msg) {
    tip.textContent = msg;
    tip.classList.add('on');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => tip.classList.remove('on'), 1800);
  }

  root.getElementById('m').onclick = () => hiziayarla(speed - vercekisimbulamadim);
  root.getElementById('a').onclick = () => hiziayarla(speed + vercekisimbulamadim);
  root.getElementById('r').onclick = () => hiziayarla(1);
  root.getElementById('c').onclick = ssal;
  input.onchange = () => hiziayarla(parseFloat(input.value) || 1);

  document.addEventListener('keydown', e => {
    if (!e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key === 'ArrowUp') { hiziayarla(speed + vercekisimbulamadim); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { hiziayarla(speed - vercekisimbulamadim); e.preventDefault(); }
    else if (e.key === '0') { hiziayarla(1); e.preventDefault(); }
    else if (e.key.toLowerCase() === 's') { ssal(); e.preventDefault(); }
  }, true);

  document.addEventListener('fullscreenchange', () => {
    (document.fullscreenElement || document.documentElement).appendChild(host);
  });

  function scan() {
    const vids = vidyoyucek();
    vids.forEach(tekrarvidoyaekle);
    if (vids.length && !host.isConnected) document.documentElement.appendChild(host);
  }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });

  try {
    chrome.storage.local.get('c8speed', r => {
      if (r && r.c8speed) hiziayarla(r.c8speed);
      scan();
    });
  } catch (e) { scan(); }
})();
