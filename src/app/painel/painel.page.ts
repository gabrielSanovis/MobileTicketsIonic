import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CallRecord, AttendanceService } from '../services/attendance.service';
import { TimeService, SimClock } from '../services/time.service';

@Component({
  selector: 'app-painel',
  templateUrl: './painel.page.html',
  styleUrls: ['./painel.page.scss'],
  standalone: false,
})
export class PainelPage implements OnInit, OnDestroy {

  recentCalls: CallRecord[] = [];
  clock: SimClock | null = null;

  private _subs: Subscription[] = [];

  constructor(
    private attendance: AttendanceService,
    private time: TimeService
  ) {}

  ngOnInit(): void {
    this._subs.push(
      this.attendance.recentCalls$.subscribe(c => this.recentCalls = c),
      this.time.clock$.subscribe(c => this.clock = c)
    );
  }

  ngOnDestroy(): void { this._subs.forEach(s => s.unsubscribe()); }

  typeColor(type: string): string {
    const map: Record<string, string> = { SP: 'warning', SG: 'primary', SE: 'success' };
    return map[type] ?? 'medium';
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      SP: 'Prioritário',
      SG: 'Geral',
      SE: 'Exame'
    };
    return map[type] ?? type;
  }
}
