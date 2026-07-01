import type { AudioEngine, AudioSource } from '../types';

export class NoopAudioEngine implements AudioEngine {
  playKeystroke(): void {
    // 阶段二占位
  }

  setBgm(source: AudioSource | null): void {
    void source;
  }

  setVolume(channel: 'keystroke' | 'bgm', volume: number): void {
    void channel;
    void volume;
  }
}
