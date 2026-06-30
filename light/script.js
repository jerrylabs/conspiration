const btn = document.getElementById('toggleBtn');
const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');
const symbol = document.querySelector(".symbol");

let audioCtx;
let interval;
let isPlaying = false;
let step = 0;

const bpm = 110; // ambient / organic house tempo
const stepTime = (60 / bpm) / 4;

// --- SOFT KICK (beach thump) ---
function kick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);

  filter.type = 'lowpass';
  filter.frequency.value = 800;

  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

// --- OCEAN HAT (noise like waves) ---
function hat(time) {
  const bufferSize = audioCtx.sampleRate * 0.12;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * env * 0.5;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.8;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.05;

  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start(time);
}

// --- WARM ORGANIC BASS ---
function bass(time, note) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.value = note;

  filter.type = 'lowpass';
  filter.frequency.value = 300;
  filter.Q.value = 2;

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.25, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.7);
}

// --- AMBIENT PAD (ocean air layer) ---
function pad(time) {
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc2.type = 'sine';

  osc.frequency.value = 220;
  osc2.frequency.value = 330;

  gain.gain.setValueAtTime(0.02, time);
  gain.gain.linearRampToValueAtTime(0.06, time + 4);
  gain.gain.linearRampToValueAtTime(0.02, time + 8);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc2.start(time);
  osc.stop(time + 8);
  osc2.stop(time + 8);
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
function sequencer() {
  const time = audioCtx.currentTime;

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
}

// --- TOGGLE ---
btn.addEventListener('click', async () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    drawViz();
  }

  if (!isPlaying) {
    await audioCtx.resume();
    interval = setInterval(sequencer, stepTime * 1000);
    btn.textContent = 'STOP THE RITUAL';
    isPlaying = true;
    symbol.classList.add("playing");
  } else {
    clearInterval(interval);
    btn.textContent = 'ENTER THE RITUAL';
    isPlaying = false;
    symbol.classList.remove("playing");
  }
});
