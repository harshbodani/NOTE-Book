const $ = (selector) => document.querySelector(selector);
const canvas = $('#drawingCanvas');
const stage = $('#paperStage');
const ctx = canvas.getContext('2d');
const state = { tool: 'pen', colour: '#34323c', size: 4, drawing: false, points: [], holdTimer: null, pages: ['Visual directions', 'Morning pages', 'Loose ideas'], notebooks: [
  ['Studio Notes', '#a69bea', 3], ['Work & ideas', '#e6af8e', 5], ['Reading list', '#8abaae', 2], ['Daily sketches', '#d7b177', 7]
] };

function resizeCanvas() { const r = stage.getBoundingClientRect(); const dpr = devicePixelRatio || 1; canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
resizeCanvas(); addEventListener('resize', resizeCanvas);

function renderNotebooks() {
  $('#notebookList').innerHTML = state.notebooks.map(([name, colour, count], i) => `<button class="notebook ${i === 0 ? 'active' : ''}" data-book="${i}"><i class="notebook-icon" style="--c:${colour}"></i><span>${name}</span><small>${count}</small></button>`).join('');
}
renderNotebooks();

function point(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; }
function setBrush() { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = state.tool === 'eraser' ? '#fffdfb' : state.colour; ctx.globalAlpha = state.tool === 'highlighter' ? .25 : 1; ctx.lineWidth = state.tool === 'highlighter' ? state.size * 4 : state.size; }
function stroke(a, b, mid) { setBrush(); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, mid.x, mid.y); ctx.stroke(); }
function renderStroke(points) {
  if (points.length < 2) return;
  const first = points[0], second = points[1]; setBrush(); ctx.beginPath(); ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length - 1; i++) { const p = points[i], n = points[i + 1]; ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2); }
  ctx.lineTo(second.x, second.y); ctx.stroke();
}
function drawShape(points) {
  if (points.length < 3) return; const xs = points.map(p => p.x), ys = points.map(p => p.y); const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  setBrush(); ctx.globalAlpha = 1; ctx.beginPath();
  const dist = Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y);
  if (dist < Math.max(w, h) * .3) { const ratio = w / h; if (ratio > .75 && ratio < 1.25) ctx.rect(x, y, w, h); else { ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); } }
  else { ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points.at(-1).x, points.at(-1).y); } ctx.stroke();
}
canvas.addEventListener('pointerdown', (e) => { if (state.tool === 'select') return; canvas.setPointerCapture(e.pointerId); state.drawing = true; state.points = [point(e)]; clearTimeout(state.holdTimer); state.holdTimer = setTimeout(() => { if (state.drawing && state.points.length > 2) { drawShape(state.points); state.points = []; state.drawing = false; toast('Shape refined ✦'); } }, 580); });
canvas.addEventListener('pointermove', (e) => { if (!state.drawing) return; const p = point(e), old = state.points.at(-1); state.points.push(p); if (state.tool === 'line') return; const mid = { x: (old.x + p.x) / 2, y: (old.y + p.y) / 2 }; stroke(old, p, mid); });
function finish(e) { if (!state.drawing) return; clearTimeout(state.holdTimer); const p = point(e); state.points.push(p); if (state.tool === 'shape') drawShape(state.points); else if (state.tool === 'line') { setBrush(); ctx.beginPath(); ctx.moveTo(state.points[0].x, state.points[0].y); ctx.lineTo(p.x, p.y); ctx.stroke(); } state.drawing = false; state.points = []; save(); }
canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish);

document.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => { state.tool = btn.dataset.tool; document.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('active', x === btn)); toast(state.tool === 'shape' ? 'Shape recognition on' : `${state.tool[0].toUpperCase() + state.tool.slice(1)} selected`); }));
const colours = ['#34323c', '#6f61ba', '#e26f6f', '#d99e34', '#3f9d7c', '#4289b7', '#e05f9d'];
$('#shadeRow').innerHTML = colours.map(c => `<button style="background:${c}" data-colour="${c}" aria-label="${c}"></button>`).join('');
function setColour(c) { state.colour = c; $('#activeColour').style.background = c; $('#colourCode').textContent = c.toUpperCase(); }
setColour(state.colour); $('#shadeRow').addEventListener('click', e => { if (e.target.dataset.colour) { setColour(e.target.dataset.colour); $('#colourPopover').classList.remove('show'); } });
$('#colourButton').onclick = () => { $('#colourPopover').classList.toggle('show'); $('#sizeRange').classList.remove('show'); };
$('#colourWheel').onclick = e => { const r = e.currentTarget.getBoundingClientRect(), x = e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2, angle=(Math.atan2(y,x)*180/Math.PI+450)%360; const c=`hsl(${Math.round(angle)} 65% 53%)`; setColour(c); $('#wheelDot').style.left=`${e.clientX-r.left-7}px`; $('#wheelDot').style.top=`${e.clientY-r.top-7}px`; };
$('#sizeButton').onclick = () => { $('#sizeRange').classList.toggle('show'); $('#colourPopover').classList.remove('show'); }; $('#sizeRange').oninput = e => state.size = +e.target.value;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 1800); }
function save() { $('#syncState').innerHTML = '<i></i> Saving…'; setTimeout(() => { localStorage.setItem('paperly-last-edit', Date.now()); $('#syncState').innerHTML = '<i></i> Saved to this device'; }, 350); }
$('#driveButton').onclick = () => { const connected = $('#driveLabel').textContent.includes('Connected'); $('#driveLabel').textContent = connected ? 'Connect your Drive' : 'Drive connected'; $('#driveDetail').textContent = connected ? 'Keep every idea in sync' : 'Auto-sync is ready'; $('#syncState').innerHTML = connected ? '<i></i> Saved to this device' : '<i></i> Synced to Google Drive'; toast(connected ? 'Drive disconnected' : 'Google Drive connected securely'); };
$('#addNotebook').onclick = () => { const name = `Untitled notebook ${state.notebooks.length + 1}`; state.notebooks.push([name, colours[state.notebooks.length % colours.length], 1]); renderNotebooks(); toast('Notebook created'); };
$('#newPageButton').onclick = () => { const n = state.pages.length + 1; state.pages.push(`Untitled page ${n}`); $('#pageCount').textContent = `${state.pages.length} pages`; $('#pageTitle').innerHTML = `Untitled page ${n} <span>✦</span>`; $('#pageCrumb').textContent = `${String(n).padStart(2, '0')} — Untitled page`; ctx.clearRect(0, 0, canvas.width, canvas.height); toast('New page created'); };
$('#pagesButton').onclick = () => toast(state.pages.map((p, i) => `${i + 1}. ${p}`).join('  ·  '));
$('#addBlock').onclick = () => { const note = document.createElement('div'); note.className = 'text-block'; note.contentEditable = 'true'; note.textContent = 'Write a thought…'; note.style.cssText = 'position:absolute;left:26%;top:68%;font:600 20px Playfair Display;color:#34323c;pointer-events:auto;outline:none;z-index:4'; $('#paperContent').append(note); note.focus(); };
$('#pageTitle').addEventListener('input', save);
