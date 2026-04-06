import { Component, OnInit } from '@angular/core';
import { DailyReport } from '../models/report.model';
import { ReportService } from '../services/report.service';

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
  standalone: false,
})
export class RelatoriosPage implements OnInit {

  availableDates: string[] = [];
  selectedDate = '';
  report: DailyReport | null = null;

  constructor(private reportSvc: ReportService) {}

  ngOnInit(): void {
    this._refreshDates();
  }

  ionViewWillEnter(): void {
    this._refreshDates();
  }

  private _refreshDates(): void {
    this.availableDates = this.reportSvc.getAvailableDates();
    if (this.availableDates.length > 0) {
      if (!this.selectedDate || !this.availableDates.includes(this.selectedDate)) {
        this.selectedDate = this.availableDates[this.availableDates.length - 1];
      }
      this.loadReport();
    } else {
      this.report = null;
    }
  }

  loadReport(): void {
    this.report = this.reportSvc.generateDaily(this.selectedDate);
  }

  formatMin(min: number): string {
    return min.toFixed(1) + ' min';
  }

  formatDate(ts: number | undefined): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'Concluído',
      NO_SHOW: 'Não compareceu',
      DISCARDED: 'Descartado',
      WAITING: 'Aguardando',
      CALLED: 'Chamado',
      IN_SERVICE: 'Em atendimento'
    };
    return map[s] ?? s;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'success',
      NO_SHOW: 'warning',
      DISCARDED: 'medium',
      WAITING: 'primary',
      CALLED: 'secondary',
      IN_SERVICE: 'tertiary'
    };
    return map[s] ?? 'medium';
  }

  typeColor(type: string): string {
    const map: Record<string, string> = { SP: 'warning', SG: 'primary', SE: 'success' };
    return map[type] ?? 'medium';
  }
}
