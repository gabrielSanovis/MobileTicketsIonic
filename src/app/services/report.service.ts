import { Injectable } from '@angular/core';
import { Ticket } from '../models/ticket.model';
import { DailyReport, TicketDetail } from '../models/report.model';
import { TicketService } from './ticket.service';

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private ticketSvc: TicketService) {}

  generateDaily(dateStr?: string): DailyReport {
    const allTickets = this.ticketSvc.getAll();
    const target = dateStr ?? this._todayStr();

    const forDay = allTickets.filter(t => this._ticketDateStr(t) === target);

    const issued = forDay.length;
    const served = forDay.filter(t => t.status === 'COMPLETED').length;
    const noShow = forDay.filter(t => t.status === 'NO_SHOW').length;
    const discarded = forDay.filter(t => t.status === 'DISCARDED').length;

    const issuedByType = {
      SP: forDay.filter(t => t.type === 'SP').length,
      SG: forDay.filter(t => t.type === 'SG').length,
      SE: forDay.filter(t => t.type === 'SE').length
    };

    const servedByType = {
      SP: forDay.filter(t => t.type === 'SP' && t.status === 'COMPLETED').length,
      SG: forDay.filter(t => t.type === 'SG' && t.status === 'COMPLETED').length,
      SE: forDay.filter(t => t.type === 'SE' && t.status === 'COMPLETED').length
    };

    const completedWithTime = forDay.filter(t => t.status === 'COMPLETED' && t.calledAt && t.completedAt);
    const averageTM = completedWithTime.length > 0
      ? completedWithTime.reduce((acc, t) => {
          const mins = (t.completedAt! - t.calledAt!) / 60_000;
          return acc + mins;
        }, 0) / completedWithTime.length
      : 0;

    const details: TicketDetail[] = forDay.map(t => ({
      id: t.id,
      type: t.type,
      issuedAt: t.issuedAt,
      calledAt: t.calledAt,
      completedAt: t.completedAt,
      boothId: t.boothId,
      status: t.status,
      waitMinutes: t.calledAt ? (t.calledAt - t.issuedAt) / 60_000 : undefined,
      serviceMinutes: (t.calledAt && t.completedAt) ? (t.completedAt - t.calledAt) / 60_000 : undefined
    }));

    return {
      date: target,
      totalIssued: issued,
      totalServed: served,
      totalNoShow: noShow,
      totalDiscarded: discarded,
      issuedByType,
      servedByType,
      averageTM,
      details
    };
  }

  getAvailableDates(): string[] {
    const tickets = this.ticketSvc.getAll();
    const dates = new Set<string>();
    tickets.forEach(t => dates.add(this._ticketDateStr(t)));
    return Array.from(dates).sort();
  }

  private _ticketDateStr(t: Ticket): string {
    const d = new Date(t.issuedAt);
    return d.toISOString().slice(0, 10);
  }

  private _todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
