import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Booth } from '../models/booth.model';
import { Ticket } from '../models/ticket.model';
import { AttendanceService } from '../services/attendance.service';
import { BoothService } from '../services/booth.service';
import { QueueService } from '../services/queue.service';
import { TimeService } from '../services/time.service';

@Component({
  selector: 'app-atendente',
  templateUrl: './atendente.page.html',
  styleUrls: ['./atendente.page.scss'],
  standalone: false,
})
export class AtendentePage implements OnInit, OnDestroy {

  booths: Booth[] = [];
  selectedBoothId: number | null = null;
  currentTicket: Ticket | null = null;
  queueCounts: { SP: number; SG: number; SE: number } = { SP: 0, SG: 0, SE: 0 };
  shiftActive = false;

  /** Service timer in real seconds */
  serviceElapsed = 0;
  private _timerSub?: Subscription;
  private _serviceStart?: number;

  private _subs: Subscription[] = [];

  constructor(
    private attendance: AttendanceService,
    private boothSvc: BoothService,
    private queueSvc: QueueService,
    private time: TimeService
  ) {}

  ngOnInit(): void {
    this._subs.push(
      this.boothSvc.booths$.subscribe(b => {
        this.booths = b;
        if (this.selectedBoothId === null && b.length > 0) {
          this.selectedBoothId = b[0].id;
        }
        this._refreshCurrentTicket();
      }),
      this.queueSvc.queueCounts$.subscribe(c => this.queueCounts = c),
      this.attendance.shiftActive$.subscribe(s => this.shiftActive = s)
    );
  }

  ngOnDestroy(): void {
    this._subs.forEach(s => s.unsubscribe());
    this._timerSub?.unsubscribe();
  }

  get selectedBooth(): Booth | undefined {
    return this.booths.find(b => b.id === this.selectedBoothId);
  }

  get totalWaiting(): number {
    return this.queueCounts.SP + this.queueCounts.SG + this.queueCounts.SE;
  }

  selectBooth(id: number): void {
    this.selectedBoothId = id;
    this._refreshCurrentTicket();
  }

  callNext(): void {
    if (this.selectedBoothId === null) return;
    const ticket = this.attendance.callNext(this.selectedBoothId);
    if (ticket) {
      this.currentTicket = ticket;
      this._startTimer();
    } else {
      this.currentTicket = null;
    }
  }

  finalize(): void {
    if (this.selectedBoothId === null) return;
    this.attendance.completeManual(this.selectedBoothId);
    this.currentTicket = null;
    this._stopTimer();
  }

  get serviceElapsedStr(): string {
    const m = Math.floor(this.serviceElapsed / 60);
    const s = this.serviceElapsed % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  typeColor(type: string): string {
    const map: Record<string, string> = { SP: 'warning', SG: 'primary', SE: 'success' };
    return map[type] ?? 'medium';
  }

  private _refreshCurrentTicket(): void {
    const booth = this.selectedBooth;
    if (!booth?.currentTicketId) {
      this.currentTicket = null;
      return;
    }
  }

  private _startTimer(): void {
    this._stopTimer();
    this._serviceStart = Date.now();
    this.serviceElapsed = 0;
    this._timerSub = interval(1000).subscribe(() => {
      this.serviceElapsed = Math.floor((Date.now() - this._serviceStart!) / 1000);
    });
  }

  private _stopTimer(): void {
    this._timerSub?.unsubscribe();
    this._timerSub = undefined;
    this.serviceElapsed = 0;
  }
}
