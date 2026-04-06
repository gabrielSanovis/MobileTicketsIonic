import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ticket, TicketType } from '../models/ticket.model';

/**
 * Priority rotation: SP → SE → SP → SG → SP → SE → SP → SG ...
 * Pattern cycles as: [SP, SE, SP, SG] repeating.
 * When a type's queue is empty, fall back to any non-empty queue (SP first).
 */
const ROTATION: TicketType[] = ['SP', 'SE', 'SP', 'SG'];

@Injectable({ providedIn: 'root' })
export class QueueService {

  private _queues: { SP: Ticket[]; SG: Ticket[]; SE: Ticket[] } = { SP: [], SG: [], SE: [] };
  private _rotationIndex = 0;

  private _queues$ = new BehaviorSubject<{ SP: number; SG: number; SE: number }>({ SP: 0, SG: 0, SE: 0 });
  readonly queueCounts$ = this._queues$.asObservable();

  enqueue(ticket: Ticket): void {
    this._queues[ticket.type].push(ticket);
    this._emit();
  }

  /**
   * Dequeue the next ticket following the rotation.
   * Returns undefined if all queues are empty.
   */
  dequeue(): Ticket | undefined {
    const total = this._totalWaiting();
    if (total === 0) return undefined;

    // Try rotation order; if expected type empty, try others
    for (let attempt = 0; attempt < ROTATION.length; attempt++) {
      const idx = (this._rotationIndex + attempt) % ROTATION.length;
      const type = ROTATION[idx];
      if (this._queues[type].length > 0) {
        this._rotationIndex = (idx + 1) % ROTATION.length;
        const ticket = this._queues[type].shift()!;
        this._emit();
        return ticket;
      }
    }

    // Fallback: just grab whatever is available (SP > SE > SG)
    for (const t of ['SP', 'SE', 'SG'] as TicketType[]) {
      if (this._queues[t].length > 0) {
        const ticket = this._queues[t].shift()!;
        this._emit();
        return ticket;
      }
    }
    return undefined;
  }

  getCounts(): { SP: number; SG: number; SE: number } {
    return {
      SP: this._queues.SP.length,
      SG: this._queues.SG.length,
      SE: this._queues.SE.length
    };
  }

  totalWaiting(): number {
    return this._totalWaiting();
  }

  /** Remove a specific ticket from queue (e.g. no-show detection) */
  remove(ticketId: string): void {
    for (const type of ['SP', 'SG', 'SE'] as TicketType[]) {
      this._queues[type] = this._queues[type].filter(t => t.id !== ticketId);
    }
    this._emit();
  }

  clearAll(): void {
    this._queues = { SP: [], SG: [], SE: [] };
    this._rotationIndex = 0;
    this._emit();
  }

  private _totalWaiting(): number {
    return this._queues.SP.length + this._queues.SG.length + this._queues.SE.length;
  }

  private _emit(): void {
    this._queues$.next(this.getCounts());
  }
}
