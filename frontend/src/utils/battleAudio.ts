export type BattleSoundKey =
  | 'damage_normal'
  | 'damage_super'
  | 'damage_weak'
  | 'recall'
  | 'throw'
  | 'ball_drop'
  | 'faint'
  | 'cursor'
  | 'decision'
  | 'cancel'
  | 'party_switch';

class BattleAudioManager {
  private muted: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgm: string | null = null;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public playSE(key: BattleSoundKey, volume = 0.65) {
    if (this.muted) return;
    try {
      const audio = new Audio(`/audio/se/${key}.ogg`);
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore browser autoplay restrictions until first user interaction
      });
    } catch {
      // No-op if audio unsupported
    }
  }

  public playBGM(track: 'battle_trainer' | 'victory_trainer', volume = 0.32) {
    const src = `/audio/bgm/${track}.ogg`;
    if (this.currentBgm === src && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }
    this.stopBGM();
    try {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = volume;
      audio.muted = this.muted;
      this.bgmAudio = audio;
      this.currentBgm = src;
      audio.play().catch(() => {
        // Will start on next user gesture if blocked
      });
    } catch {
      // No-op
    }
  }

  public ensureBgmPlaying() {
    if (this.bgmAudio && this.bgmAudio.paused && !this.muted) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  public stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
      this.currentBgm = null;
    }
  }
}

export const battleAudio = new BattleAudioManager();
