import type { SkillId } from "@penglai/shared";

export const audioSettingsStorageKey = "penglai-audio-settings";
const defaultAudioVolume = 0.65;

interface AudioSettings {
  volume?: number;
  muted?: boolean;
}

function clampVolume(value: number) {
  return Math.max(0, Math.min(value, 1));
}

export class GameAudioManager {
  private context?: AudioContext;
  private volume = defaultAudioVolume;
  private muted = false;

  loadSettings() {
    try {
      const raw = window.localStorage.getItem(audioSettingsStorageKey);
      if (!raw) {
        return;
      }

      const settings = JSON.parse(raw) as AudioSettings;
      if (typeof settings.volume === "number" && Number.isFinite(settings.volume)) {
        this.volume = clampVolume(settings.volume);
      }
      this.muted = Boolean(settings.muted);
    } catch {
      this.volume = defaultAudioVolume;
      this.muted = false;
    }
  }

  getVolume() {
    return this.volume;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.saveSettings();
  }

  adjustVolume(delta: number) {
    this.volume = clampVolume(Math.round((this.volume + delta) * 10) / 10);
    if (this.volume > 0) {
      this.muted = false;
    }
    this.saveSettings();
  }

  playVolumePreview() {
    this.playTone(440, 60, 0.025, "triangle", 0, 660);
  }

  playLevelUpSound() {
    this.playTone(440, 100, 0.028, "triangle", 0, 660);
    this.playTone(660, 120, 0.026, "triangle", 90, 880);
    this.playTone(880, 180, 0.022, "sine", 190, 1320);
  }

  playBlockedSound() {
    this.playTone(150, 88, 0.022, "sawtooth", 0, 95);
  }

  playAttackSound(isSkill: boolean, skillId?: SkillId) {
    if (!isSkill) {
      this.playTone(230, 55, 0.026, "square", 0, 170);
      this.playTone(520, 38, 0.018, "triangle", 28, 360);
      return;
    }

    if (skillId === "sword-cleave") {
      this.playTone(360, 95, 0.034, "sawtooth", 0, 760);
      this.playTone(820, 58, 0.022, "triangle", 35, 520);
      return;
    }

    if (skillId === "spirit-talisman") {
      this.playTone(520, 105, 0.028, "sine", 0, 700);
      this.playTone(940, 130, 0.018, "triangle", 55, 1180);
      return;
    }

    this.playTone(980, 70, 0.032, "triangle", 0, 540);
    this.playTone(420, 42, 0.018, "square", 45, 260);
  }

  playRemoteAttackSound(isSkill: boolean, skillId?: SkillId) {
    // 遠端玩家出手的輕量版:單音、約自己出手音量的四成,多人同圖才不會吵
    if (!isSkill) {
      this.playTone(230, 42, 0.01, "square", 0, 170);
      return;
    }

    const frequency = skillId === "spirit-talisman" ? 520 : skillId === "hunter-shot" ? 980 : 360;
    this.playTone(frequency, 55, 0.012, "triangle", 0, frequency + 180);
  }

  playHitSound(isSkill: boolean, defeated: boolean, skillId?: SkillId) {
    if (isSkill) {
      const frequency = skillId === "spirit-talisman" ? 720 : skillId === "hunter-shot" ? 840 : 560;
      this.playTone(frequency, 72, 0.035, "triangle", 0, 310);
    } else {
      this.playTone(360, 62, 0.03, "triangle", 0, 210);
    }

    if (defeated) {
      this.playTone(260, 130, 0.032, "sine", 45, 130);
    }
  }

  playMissSound(isSkill: boolean, skillId?: SkillId) {
    const frequency = skillId === "spirit-talisman" ? 260 : isSkill ? 190 : 145;
    this.playTone(frequency, 70, 0.02, "triangle", 0, Math.max(80, frequency - 70));
  }

  private saveSettings() {
    try {
      window.localStorage.setItem(
        audioSettingsStorageKey,
        JSON.stringify({
          volume: this.volume,
          muted: this.muted
        })
      );
    } catch {
      // Local audio preferences are non-critical.
    }
  }

  private getContext() {
    if (typeof AudioContext === "undefined") {
      return undefined;
    }

    this.context ??= new AudioContext();
    if (this.context.state === "suspended") {
      void this.context.resume();
    }

    return this.context;
  }

  private playTone(
    frequency: number,
    durationMs: number,
    volume = 0.035,
    type: OscillatorType = "sine",
    delayMs = 0,
    endFrequency = frequency
  ) {
    const effectiveVolume = this.muted ? 0 : volume * this.volume;
    if (effectiveVolume <= 0) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    const startAt = context.currentTime + delayMs / 1000;
    const endAt = startAt + durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), startAt);
    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endAt);
    }
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(effectiveVolume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.03);
  }
}
