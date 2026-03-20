import { Injectable, signal } from '@angular/core';
import Vapi from '@vapi-ai/web';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';

@Injectable({ providedIn: 'root' })
export class VapiService {
  private vapi: Vapi | null = null;

  status = signal<CallStatus>('idle');
  isMuted = signal(false);
  transcript = signal<{ role: string; text: string }[]>([]);
  volumeLevel = signal(0);

  init(apiKey: string) {
    if (this.vapi) {
      this.vapi.stop();
    }
    this.vapi = new Vapi(apiKey);

    this.vapi.on('call-start', () => this.status.set('active'));
    this.vapi.on('call-end', () => {
      this.status.set('idle');
      this.isMuted.set(false);
      this.volumeLevel.set(0);
    });
    this.vapi.on('speech-start', () => {});
    this.vapi.on('speech-end', () => {});
    this.vapi.on('volume-level', (vol: number) => this.volumeLevel.set(vol));
    this.vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        this.transcript.update(t => [...t, { role: msg.role, text: msg.transcript }]);
      }
    });
    this.vapi.on('error', (err: any) => {
      console.error('Vapi error:', err);
      this.status.set('idle');
    });
  }

  async startCall(assistantId: string) {
    if (!this.vapi) return;
    this.status.set('connecting');
    this.transcript.set([]);
    await this.vapi.start(assistantId);
  }

  stopCall() {
    if (!this.vapi) return;
    this.status.set('ending');
    this.vapi.stop();
  }

  toggleMute() {
    if (!this.vapi) return;
    const muted = !this.isMuted();
    this.vapi.setMuted(muted);
    this.isMuted.set(muted);
  }
}
