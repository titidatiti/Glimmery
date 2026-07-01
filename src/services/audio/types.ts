export interface AudioSource {
  id: string;
  url: string;
  label: string;
}

export interface AudioEngine {
  playKeystroke(): void;
  setBgm(source: AudioSource | null): void;
  setVolume(channel: 'keystroke' | 'bgm', volume: number): void;
}
