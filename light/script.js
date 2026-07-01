const btn = document.getElementById('toggleBtn');
const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');
const symbol = document.querySelector(".symbol");

let isPlaying = false;
let started = false;
let step = 0;

const bpm = 110; // ambient / organic house tempo
Tone.Transport.bpm.value = bpm;

// Master chain (soft limiter to tame peaks on mobile speakers)
const master = new Tone.Limiter(-2).toDestination();

// Cleanup helper: dispose short-lived Tone nodes after they finish
function disposeAfter(nodes, time) {
  const delayMs = Math.max(0, time - Tone.now()) * 1000 + 200;
  setTimeout(() => nodes.forEach(n => n.dispose()), delayMs);
}

// --- SOFT KICK (beach thump) ---
function kick(time) {
  const osc = new Tone.Oscillator(110, 'sine');
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 800 });
  const gain = new Tone.Gain(0.6).connect(master);
  osc.connect(filter);
  filter.connect(gain);

  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);

  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

  osc.start(time);
  osc.stop(time + 0.3);
  disposeAfter([osc, filter, gain], time + 0.35);
}

// --- OCEAN HAT (noise like waves) ---
function hat(time) {
  const noise = new Tone.Noise('white');
  const filter = new Tone.Filter({ type: 'bandpass', frequency: 1200, Q: 0.8 });
  const gain = new Tone.Gain(0).connect(master);
  noise.connect(filter);
  filter.connect(gain);

  gain.gain.setValueAtTime(0.025, time);
  gain.gain.linearRampToValueAtTime(0, time + 0.12);

  noise.start(time);
  noise.stop(time + 0.12);
  disposeAfter([noise, filter, gain], time + 0.2);
}

// --- WARM ORGANIC BASS ---
function bass(time, note) {
  const osc = new Tone.Oscillator(note, 'sine');
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 300, Q: 2 });
  const gain = new Tone.Gain(0.0001).connect(master);
  osc.connect(filter);
  filter.connect(gain);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.25, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

  osc.start(time);
  osc.stop(time + 0.7);
  disposeAfter([osc, filter, gain], time + 0.8);
}

// --- AMBIENT PAD (ocean air layer) ---
function pad(time) {
  const osc = new Tone.Oscillator(220, 'sine');
  const osc2 = new Tone.Oscillator(330, 'sine');
  const gain = new Tone.Gain(0.02).connect(master);
  osc.connect(gain);
  osc2.connect(gain);

  gain.gain.setValueAtTime(0.02, time);
  gain.gain.linearRampToValueAtTime(0.06, time + 4);
  gain.gain.linearRampToValueAtTime(0.02, time + 8);

  osc.start(time);
  osc2.start(time);
  osc.stop(time + 8);
  osc2.stop(time + 8);
  disposeAfter([osc, osc2, gain], time + 8.2);
}

// --- CALM VISUAL (waves instead of bars) ---
function drawViz() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const t = Date.now() / 800;

  ctx.beginPath();
  for (let x = 0; x < canvas.width; x += 5) {
    const y =
      canvas.height / 2 +
      Math.sin(x * 0.02 + t) * 20 +
      Math.sin(x * 0.01 + t * 0.7) * 15;

    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = '#00b7ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  requestAnimationFrame(drawViz);
}

// --- SEQUENCER (organic, not rigid techno grid) ---
Tone.Transport.scheduleRepeat((time) => {
  // soft kick pattern (less mechanical)
  if (step % 8 === 0 || step % 32 === 5) kick(time);

  // ocean-like hats (sparse)
  if (step % 3 === 0 && Math.random() > 0.3) hat(time);

  // evolving bass
  const pattern = [55, 49, 65.4, 58];
  bass(time, pattern[Math.floor(step / 8) % pattern.length]);

  // occasional pad wash
  if (step % 64 === 0) pad(time);

  step++;
}, '16n');

// --- TOGGLE ---
btn.addEventListener('click', async () => {
  // Must run inside the user gesture to unlock audio on iOS/Safari
  await Tone.start();

  if (!started) {
    drawViz();
    started = true;
  }

  if (!isPlaying) {
    Tone.Transport.start();
    btn.textContent = 'STOP THE RITUAL';
    isPlaying = true;
    symbol.classList.add("playing");
  } else {
    Tone.Transport.stop();
    btn.textContent = 'ENTER THE RITUAL';
    isPlaying = false;
    symbol.classList.remove("playing");
  }
});
