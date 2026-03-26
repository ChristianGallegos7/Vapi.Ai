import { Injectable, signal } from '@angular/core';
import Vapi from '@vapi-ai/web';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';
export type MicPermission = 'unknown' | 'granted' | 'denied';

@Injectable({ providedIn: 'root' })
export class VapiService {
  private vapi: Vapi | null = null;

  status = signal<CallStatus>('idle');
  isMuted = signal(false);
  isSpeaking = signal(false);
  transcript = signal<{ role: string; text: string }[]>([]);
  volumeLevel = signal(0);
  micPermission = signal<MicPermission>('unknown');

  /** Solicita permiso del micrófono anticipadamente para eliminar el delay al iniciar llamada */
  async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Liberar inmediatamente — solo necesitábamos el grant del permiso
      stream.getTracks().forEach(t => t.stop());
      this.micPermission.set('granted');
      return true;
    } catch {
      this.micPermission.set('denied');
      return false;
    }
  }

  init(apiKey: string) {
    if (this.vapi) {
      this.vapi.stop();
    }
    this.vapi = new Vapi(apiKey);

    this.vapi.on('call-start', () => this.status.set('active'));
    this.vapi.on('call-end', () => {
      this.status.set('idle');
      this.isMuted.set(false);
      this.isSpeaking.set(false);
      this.volumeLevel.set(0);
    });
    this.vapi.on('speech-start', () => this.isSpeaking.set(true));
    this.vapi.on('speech-end', () => this.isSpeaking.set(false));
    this.vapi.on('volume-level', (vol: number) => this.volumeLevel.set(vol));
    this.vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        this.transcript.update(t => [...t, { role: msg.role, text: msg.transcript }]);
      }
    });
    this.vapi.on('error', (err: any) => {
      console.error('Vapi error:', err);
      this.status.set('idle');
      this.isSpeaking.set(false);
    });
  }

  async startCall(assistantId: string) {
    if (!this.vapi) return;
    this.status.set('connecting');
    this.transcript.set([]);
    this.isSpeaking.set(false);
    await this.vapi.start(assistantId);
  }

  stopCall() {
    if (!this.vapi) return;
    this.status.set('ending');
    this.isSpeaking.set(false);
    this.vapi.stop();
  }

  toggleMute() {
    if (!this.vapi) return;
    const muted = !this.isMuted();
    this.vapi.setMuted(muted);
    this.isMuted.set(muted);
  }
}
