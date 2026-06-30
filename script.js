const btn = document.getElementById('toggleBtn');
const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');
const symbol = document.querySelector(".symbol");

let audioCtx;
let interval;
let isPlaying = false;
let step = 0;
const bpm = 145;
const stepTime = (60 / bpm) / 4; // 16th notes

function kick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.15);
}

function hat(time) {
  const bufferSize = audioCtx.sampleRate * 0.04;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.12;

  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start(time);
}

function bass(time, note) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.value = note;

  filter.type = 'lowpass';
  filter.frequency.value = 500;
  filter.Q.value = 8;

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.18, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  osc.connect(filter).connect(gain).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.2);
}

function drawViz() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bars = 32;
  const w = canvas.width / bars;

  for (let i = 0; i < bars; i++) {
    const active = (i === step % bars);
    const h = active ? 90 : 20 + Math.sin((Date.now()/120 + i)) * 10;

    ctx.fillStyle = active ? '#00ffae' : '#00b7ff';
    ctx.fillRect(i * w + 4, canvas.height - h - 10, w - 8, h);
  }

  requestAnimationFrame(drawViz);
}

function sequencer() {
  const time = audioCtx.currentTime;

  // Kick on every beat
  if (step % 4 === 0 || step % 64 === 3 || step % 128 === 2 || step % 64 === 26) kick(time);

  // Offbeat hats
  if (step % 2 === 0 && step % 32 !== 0) hat(time);

  // Psy bass
  const pattern = [55, 55, 65.4, 55];
  bass(time, pattern[Math.floor(step / 4) % pattern.length]);

  step++;
}

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
