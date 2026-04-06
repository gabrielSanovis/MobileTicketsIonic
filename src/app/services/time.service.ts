import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { StorageService } from './storage.service';

// Expediente 07:00–17:00 (minutos do dia)
export const SHIFT_START_MIN = 7 * 60;   // 420
export const SHIFT_END_MIN   = 17 * 60;  // 1020

export interface SimClock {
  simTime: Date;        // data/hora simulada
  dayMinutes: number;   // minutos desde meia-noite simulada
  inShift: boolean;
}

@Injectable({ providedIn: 'root' })
export class TimeService implements OnDestroy {

  private _factor = 60;          // 1 seg real = 60 min simulados
  private _simTime!: Date;
  private _tickSub?: Subscription;

  private _clock$ = new BehaviorSubject<SimClock>(this._buildClock());
  readonly clock$ = this._clock$.asObservable();

  constructor(private storage: StorageService) {
    const saved = this.storage.get<number>('sim_time', 0);
    const savedFactor = this.storage.get<number>('sim_factor', 60);
    this._factor = savedFactor;
    if (saved) {
      this._simTime = new Date(saved);
    } else {
      this._simTime = this._todayAt(SHIFT_START_MIN);
    }
    this._clock$.next(this._buildClock());
  }

  get factor(): number { return this._factor; }

  setFactor(f: number): void {
    this._factor = f;
    this.storage.set('sim_factor', f);
  }

  get simTime(): Date { return new Date(this._simTime); }

  start(): void {
    if (this._tickSub) return;
    // Tick every real second. Each tick advances simTime by `factor` minutes.
    this._tickSub = interval(1000).subscribe(() => {
      this._simTime = new Date(this._simTime.getTime() + this._factor * 60 * 1000);
      this.storage.set('sim_time', this._simTime.getTime());
      this._clock$.next(this._buildClock());
    });
  }

  stop(): void {
    this._tickSub?.unsubscribe();
    this._tickSub = undefined;
  }

  isRunning(): boolean { return !!this._tickSub; }

  /** Reset simulated clock to today at SHIFT_START */
  resetToday(): void {
    this._simTime = this._todayAt(SHIFT_START_MIN);
    this.storage.set('sim_time', this._simTime.getTime());
    this._clock$.next(this._buildClock());
  }

  /** Advance clock to a specific minute-of-day offset today */
  setDayMinutes(mins: number): void {
    const base = new Date(this._simTime);
    base.setHours(0, 0, 0, 0);
    this._simTime = new Date(base.getTime() + mins * 60 * 1000);
    this.storage.set('sim_time', this._simTime.getTime());
    this._clock$.next(this._buildClock());
  }

  now(): number {
    return this._simTime.getTime();
  }

  private _buildClock(): SimClock {
    if (!this._simTime) {
      this._simTime = this._todayAt(SHIFT_START_MIN);
    }
    const h = this._simTime.getHours();
    const m = this._simTime.getMinutes();
    const dayMinutes = h * 60 + m;
    return {
      simTime: new Date(this._simTime),
      dayMinutes,
      inShift: dayMinutes >= SHIFT_START_MIN && dayMinutes < SHIFT_END_MIN
    };
  }

  private _todayAt(mins: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + mins * 60 * 1000);
  }

  ngOnDestroy(): void { this.stop(); }
}
