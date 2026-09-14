// ============================================
// TASKLYN — Web Audio API sound effects
// No external audio files; generated in-browser.
// ============================================

export type PaymentSound = "success" | "error" | "cancelled" | "processing";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

function tone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  gainValue = 0.05,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function success() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

function error() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 150, 0.35, "sawtooth", 0.08);
  setTimeout(() => tone(ctx, 120, 0.45, "sawtooth", 0.08), 120);
}

function cancelled() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 300, 0.18, "triangle", 0.06);
  setTimeout(() => tone(ctx, 260, 0.22, "triangle", 0.06), 130);
}

function processing() {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(ctx, 880, 0.15, "sine", 0.02);
}

export function playPaymentSound(sound: PaymentSound) {
  try {
    switch (sound) {
      case "success":
        success();
        break;
      case "error":
        error();
        break;
      case "cancelled":
        cancelled();
        break;
      case "processing":
        processing();
        break;
    }
  } catch {
    // Ignore audio errors (browsers may block autoplay).
  }
}
