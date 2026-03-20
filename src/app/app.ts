import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VapiService, CallStatus } from './vapi.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  vapi = inject(VapiService);

  apiKey = signal('c7c09407-de0d-4563-9856-179361dabd43');
  assistantId = signal('b5c8fa77-b6e5-4be0-9fee-0c2f87f5f3df');
  configured = signal(false);

  configure() {
    if (!this.apiKey() || !this.assistantId()) return;
    this.vapi.init(this.apiKey());
    this.configured.set(true);
  }

  reset() {
    this.configured.set(false);
    this.apiKey.set('');
    this.assistantId.set('');
  }

  startCall() {
    this.vapi.startCall(this.assistantId());
  }

  stopCall() {
    this.vapi.stopCall();
  }

  toggleMute() {
    this.vapi.toggleMute();
  }

  statusLabel(s: CallStatus): string {
    const labels: Record<CallStatus, string> = {
      idle: 'Listo',
      connecting: 'Conectando...',
      active: 'En llamada',
      ending: 'Terminando...'
    };
    return labels[s];
  }

  statusColor(s: CallStatus): string {
    const colors: Record<CallStatus, string> = {
      idle: 'bg-gray-100 text-gray-600',
      connecting: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      ending: 'bg-orange-100 text-orange-700'
    };
    return colors[s];
  }
}
