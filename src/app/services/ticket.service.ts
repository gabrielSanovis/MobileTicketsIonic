import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ticket, TicketType } from '../models/ticket.model';
import { StorageService } from './storage.service';
import { TimeService } from './time.service';

@Injectable({ providedIn: 'root' })
export class TicketService {

  private _tickets: Ticket[] = [];
  private _sequences: { SP: number; SG: number; SE: number } = { SP: 0, SG: 0, SE: 0 };
  private _currentDate = '';

  private _tickets$ = new BehaviorSubject<Ticket[]>([]);
  readonly tickets$ = this._tickets$.asObservable();

  constructor(private storage: StorageService, private time: TimeService) {
    this._load();
  }

  private _load(): void {
    this._tickets = this.storage.get<Ticket[]>('tickets', []);
    this._sequences = this.storage.get('sequences', { SP: 0, SG: 0, SE: 0 });
    this._currentDate = this.storage.get<string>('ticket_date', '');
    this._tickets$.next(this._tickets);
  }

  private _save(): void {
    this.storage.set('tickets', this._tickets);
    this.storage.set('sequences', this._sequences);
    this.storage.set('ticket_date', this._currentDate);
    this._tickets$.next([...this._tickets]);
  }

  /** Issue a new ticket. Resets sequence if date changed. */
  issue(type: TicketType): Ticket {
    const now = this.time.simTime;
    const dateStr = this._formatDate(now);

    if (dateStr !== this._currentDate) {
      this._sequences = { SP: 0, SG: 0, SE: 0 };
      this._currentDate = dateStr;
    }

    this._sequences[type]++;
    const seq = this._sequences[type];
    const seqStr = String(seq).padStart(3, '0');
    const id = `${dateStr}-${type}${seqStr}`;

    const ticket: Ticket = {
      id,
      type,
      sequence: seq,
      issuedAt: this.time.now(),
      status: 'WAITING'
    };

    this._tickets.push(ticket);
    this._save();
    return ticket;
  }

  getAll(): Ticket[] {
    return [...this._tickets];
  }

  getById(id: string): Ticket | undefined {
    return this._tickets.find(t => t.id === id);
  }

  update(ticket: Ticket): void {
    const idx = this._tickets.findIndex(t => t.id === ticket.id);
    if (idx >= 0) {
      this._tickets[idx] = { ...ticket };
      this._save();
    }
  }

  /** Discard all WAITING tickets (end of shift) */
  discardWaiting(): void {
    this._tickets = this._tickets.map(t =>
      t.status === 'WAITING' ? { ...t, status: 'DISCARDED' as const } : t
    );
    this._save();
  }

  private _formatDate(d: Date): string {
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }
}
