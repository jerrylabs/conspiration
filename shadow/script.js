const btn = document.getElementById('toggleBtn');
const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');
const symbol = document.querySelector(".symbol");

let isPlaying = false;
let started = false;
let step = 0;

const bpm = 145;
Tone.Transport.bpm.value = bpm;

// Master chain (soft limiter to tame peaks on mobile speakers)
const master = new Tone.Limiter(-2).toDestination();

// Cleanup helper: dispose short-lived Tone nodes after they finish
function disposeAfter(nodes, time) {
  const delayMs = Math.max(0, time - Tone.now()) * 1000 + 200;
  setTimeout(() => nodes.forEach(n => n.dispose()), delayMs);
}

function kick(time) {
  const osc = new Tone.Oscillator(140, 'sine');
  const gain = new Tone.Gain(1).connect(master);
  osc.connect(gain);

  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  osc.start(time);
  osc.stop(time + 0.15);
  disposeAfter([osc, gain], time + 0.25);
}

function hat(time) {
  const noise = new Tone.Noise('white');
  const filter = new Tone.Filter({ type: 'highpass', frequency: 6000 });
  const gain = new Tone.Gain(0).connect(master);
  noise.connect(filter);
  filter.connect(gain);

  gain.gain.setValueAtTime(0.12, time);
  gain.gain.linearRampToValueAtTime(0, time + 0.04);

  noise.start(time);
  noise.stop(time + 0.04);
  disposeAfter([noise, filter, gain], time + 0.1);
}

function bass(time, note) {
  const osc = new Tone.Oscillator(note, 'sawtooth');
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 500, Q: 8 });
  const gain = new Tone.Gain(0.0001).connect(master);
  osc.connect(filter);
  filter.connect(gain);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.18, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

  osc.start(time);
  osc.stop(time + 0.2);
  disposeAfter([osc, filter, gain], time + 0.3);
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

Tone.Transport.scheduleRepeat((time) => {
  // Kick on every beat
  if (step % 4 === 0 || step % 64 === 3 || step % 128 === 2 || step % 64 === 26) kick(time);

  // Offbeat hats
  if (step % 2 === 0 && step % 32 !== 0) hat(time);

  // Psy bass
  const pattern = [55, 55, 65.4, 55];
  bass(time, pattern[Math.floor(step / 4) % pattern.length]);

  step++;
}, '16n');

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
