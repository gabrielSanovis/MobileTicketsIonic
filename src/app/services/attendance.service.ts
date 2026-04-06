import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Ticket, TicketType } from '../models/ticket.model';
import { TicketService } from './ticket.service';
import { QueueService } from './queue.service';
import { BoothService } from './booth.service';
import { TimeService, SHIFT_END_MIN } from './time.service';
import { StorageService } from './storage.service';

export interface CallRecord {
  ticketId: string;
  boothId: number;
  boothName: string;
  calledAt: number;
  type: TicketType;
}

const NO_SHOW_RATE = 0.05;

/** Service time in simulated minutes by type (uniform range) */
const SERVICE_TIME: Record<TicketType, () => number> = {
  SP: () => Math.floor(Math.random() * 11) + 10,  // 10–20 min
  SG: () => Math.floor(Math.random() * 7) + 2,    // 2–8 min
  SE: () => Math.random() < 0.95 ? Math.floor(Math.random() * 1) + 1 : 5  // 1 min (95%) or 5 min
};

@Injectable({ providedIn: 'root' })
export class AttendanceService implements OnDestroy {

  private _recentCalls: CallRecord[] = [];
  private _recentCalls$ = new BehaviorSubject<CallRecord[]>([]);
  readonly recentCalls$ = this._recentCalls$.asObservable();

  /** boothId -> timer handle (setTimeout ID) */
  private _serviceTimers = new Map<number, ReturnType<typeof setTimeout>>();

  private _clockSub?: Subscription;
  private _shiftActive = false;

  private _shiftActive$ = new BehaviorSubject<boolean>(false);
  readonly shiftActive$ = this._shiftActive$.asObservable();

  constructor(
    private ticketSvc: TicketService,
    private queueSvc: QueueService,
    private boothSvc: BoothService,
    private time: TimeService,
    private storage: StorageService
  ) {
    this._shiftActive = this.storage.get<boolean>('shift_active', false);
    this._recentCalls = this.storage.get<CallRecord[]>('recent_calls', []);
    this._shiftActive$.next(this._shiftActive);
    this._recentCalls$.next(this._recentCalls);

    // Watch clock to auto-close shift
    this._clockSub = this.time.clock$.subscribe(clk => {
      if (this._shiftActive && !clk.inShift && clk.dayMinutes >= SHIFT_END_MIN) {
        this._autoEndShift();
      }
    });
  }

  isShiftActive(): boolean { return this._shiftActive; }

  startShift(): void {
    if (this._shiftActive) return;
    this._shiftActive = true;
    this.storage.set('shift_active', true);
    this._shiftActive$.next(true);
    this.time.start();
  }

  endShift(): void {
    if (!this._shiftActive) return;
    this._shiftActive = false;
    this.storage.set('shift_active', false);
    this._shiftActive$.next(false);
    this.time.stop();
    this._clearTimers();
    this.ticketSvc.discardWaiting();
    this.queueSvc.clearAll();
  }

  /** Issue ticket and add to queue */
  issueAndEnqueue(type: TicketType): Ticket {
    const ticket = this.ticketSvc.issue(type);
    this.queueSvc.enqueue(ticket);
    return ticket;
  }

  /**
   * Attendant calls next ticket for a booth.
   * Returns the called ticket, or undefined if queue empty.
   */
  callNext(boothId: number): Ticket | undefined {
    const next = this.queueSvc.dequeue();
    if (!next) return undefined;

    // 5% no-show simulation: mark ticket and move on
    if (Math.random() < NO_SHOW_RATE) {
      next.status = 'NO_SHOW';
      next.calledAt = this.time.now();
      this.ticketSvc.update(next);
      // Try again recursively (once)
      return this.callNext(boothId);
    }

    next.status = 'CALLED';
    next.calledAt = this.time.now();
    next.boothId = boothId;
    this.ticketSvc.update(next);
    this.boothSvc.assignTicket(boothId, next.id);

    const booth = this.boothSvc.getById(boothId);
    const record: CallRecord = {
      ticketId: next.id,
      boothId,
      boothName: booth?.name ?? `Guichê ${boothId}`,
      calledAt: next.calledAt,
      type: next.type
    };
    this._addRecentCall(record);

    // Auto-start service (mark IN_SERVICE after a moment)
    next.status = 'IN_SERVICE';
    this.ticketSvc.update(next);

    // Schedule auto-completion
    const serviceMinSim = SERVICE_TIME[next.type]();
    // Real-world ms: serviceMinSim sim-minutes / factor * 60_000 ms
    const realMs = (serviceMinSim / this.time.factor) * 60_000;
    const timer = setTimeout(() => {
      this._completeService(boothId, next.id, serviceMinSim);
    }, realMs);
    this._serviceTimers.set(boothId, timer);

    return next;
  }

  /** Manually complete service for a booth */
  completeManual(boothId: number): void {
    const booth = this.boothSvc.getById(boothId);
    if (!booth?.currentTicketId) return;
    const handle = this._serviceTimers.get(boothId);
    if (handle !== undefined) {
      clearTimeout(handle);
      this._serviceTimers.delete(boothId);
    }
    this._completeService(boothId, booth.currentTicketId, 0);
  }

  private _completeService(boothId: number, ticketId: string, _serviceMin: number): void {
    const ticket = this.ticketSvc.getById(ticketId);
    if (ticket && ticket.status === 'IN_SERVICE') {
      ticket.status = 'COMPLETED';
      ticket.completedAt = this.time.now();
      this.ticketSvc.update(ticket);
    }
    this.boothSvc.releaseTicket(boothId);
    this._serviceTimers.delete(boothId);
  }

  private _addRecentCall(record: CallRecord): void {
    this._recentCalls.unshift(record);
    if (this._recentCalls.length > 5) {
      this._recentCalls = this._recentCalls.slice(0, 5);
    }
    this.storage.set('recent_calls', this._recentCalls);
    this._recentCalls$.next([...this._recentCalls]);
  }

  private _autoEndShift(): void {
    this.endShift();
  }

  private _clearTimers(): void {
    this._serviceTimers.forEach(h => clearTimeout(h));
    this._serviceTimers.clear();
  }

  ngOnDestroy(): void {
    this._clockSub?.unsubscribe();
    this._clearTimers();
  }
}
