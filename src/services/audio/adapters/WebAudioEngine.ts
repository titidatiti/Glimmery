import type { AudioEngine, AudioSource } from '../types';

/**
 * 基于 Web Audio API 的打字音效实现。
 *
 * 设计要点：
 * - 多音源轮询：每次播放随机选择一个音源，模拟真实键盘差异感。
 * - 无音源时回退到合成的机械键盘点击声（oscillator），不依赖外部素材。
 * - 独立的打字音 / BGM 音量通道。
 * - AudioContext 延迟创建（浏览器要求用户交互后才能 resume）。
 */
export class WebAudioEngine implements AudioEngine {
  private audioCtx: AudioContext | null = null;
  private keystrokeVolume = 0.5;
  private bgmVolume = 0.5;
  private keystrokeSources: AudioBuffer[] = [];
  private bgmSource: HTMLAudioElement | null = null;
  private bgmGainNode: GainNode | null = null;

  /**
   * 预加载打字音音源。传入后替换合成回退。
   */
  async loadKeystrokeSources(urls: string[]): Promise<void> {
    if (!urls.length) return;

    const ctx = this.ensureAudioCtx();
    const buffers: AudioBuffer[] = [];

    for (const url of urls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const arrayBuf = await resp.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuf);
        buffers.push(buffer);
      } catch {
        // 单个音源加载失败不影响其他音源
      }
    }

    this.keystrokeSources = buffers;
  }

  public playKeystroke(): void {
    const ctx = this.ensureAudioCtx();

    if (this.keystrokeSources.length > 0) {
      this.playSample(ctx);
    } else {
      this.playSyntheticClick(ctx);
    }
  }

  public setBgm(source: AudioSource | null): void {
    if (this.bgmSource) {
      this.bgmSource.pause();
      this.bgmSource = null;
    }

    if (!source) {
      this.bgmGainNode = null;
      return;
    }

    const ctx = this.ensureAudioCtx();
    const audio = new Audio();
    audio.src = source.url;
    audio.loop = true;

    const src = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = this.bgmVolume;
    src.connect(gain).connect(ctx.destination);

    this.bgmSource = audio;
    this.bgmGainNode = gain;
    audio.play().catch(() => {
      // 浏览器可能阻止自动播放
    });
  }

  public setVolume(channel: 'keystroke' | 'bgm', volume: number): void {
    if (channel === 'keystroke') {
      this.keystrokeVolume = Math.max(0, Math.min(1, volume));
    } else {
      this.bgmVolume = Math.max(0, Math.min(1, volume));
      if (this.bgmGainNode) {
        this.bgmGainNode.gain.value = this.bgmVolume;
      }
    }
  }

  private ensureAudioCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** 从预加载的音源中随机播放一个。 */
  private playSample(ctx: AudioContext): void {
    const buffer =
      this.keystrokeSources[Math.floor(Math.random() * this.keystrokeSources.length)];
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = this.keystrokeVolume;

    source.connect(gain).connect(ctx.destination);
    source.start();
  }

  /**
   * 合成机械键盘点击声。
   * 使用短促的高频噪声 + 快速衰减来模拟按键触感。
   */
  private playSyntheticClick(ctx: AudioContext): void {
    const duration = 0.04;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.keystrokeVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
