import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TicketType } from '../models/ticket.model';
import { AttendanceService } from '../services/attendance.service';
import { TimeService, SimClock } from '../services/time.service';
import { ConfiguracoesPage } from '../configuracoes/configuracoes.page';

@Component({
  selector: 'app-totem',
  templateUrl: './totem.page.html',
  styleUrls: ['./totem.page.scss'],
  standalone: false,
})
export class TotemPage implements OnInit, OnDestroy {

  clock: SimClock | null = null;
  lastTicket: { id: string; type: TicketType } | null = null;
  showTicketModal = false;

  private _sub?: Subscription;

  constructor(
    private attendance: AttendanceService,
    private time: TimeService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit(): void {
    this._sub = this.time.clock$.subscribe(c => this.clock = c);
  }

  ngOnDestroy(): void { this._sub?.unsubscribe(); }

  get inShift(): boolean { return this.clock?.inShift ?? false; }
  get shiftActive(): boolean { return this.attendance.isShiftActive(); }

  emitir(type: TicketType): void {
    if (!this.shiftActive || !this.inShift) return;
    const ticket = this.attendance.issueAndEnqueue(type);
    this.lastTicket = { id: ticket.id, type: ticket.type };
    this.showTicketModal = true;
  }

  closeModal(): void {
    this.showTicketModal = false;
  }

  async openConfig(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: ConfiguracoesPage });
    await modal.present();
  }

  typeLabel(type: TicketType): string {
    const labels: Record<TicketType, string> = {
      SP: 'Prioritário (SP)',
      SG: 'Geral (SG)',
      SE: 'Exame (SE)'
    };
    return labels[type];
  }

  typeColor(type: TicketType): string {
    const colors: Record<TicketType, string> = {
      SP: 'warning',
      SG: 'primary',
      SE: 'success'
    };
    return colors[type];
  }
}
