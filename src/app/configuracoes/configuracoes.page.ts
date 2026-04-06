import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
import { BoothService } from '../services/booth.service';
import { TimeService } from '../services/time.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.page.html',
  styleUrls: ['./configuracoes.page.scss'],
  standalone: false,
})
export class ConfiguracoesPage implements OnInit {

  boothCount = 3;
  factor = 60;
  shiftActive = false;

  constructor(
    private modalCtrl: ModalController,
    private attendance: AttendanceService,
    private boothSvc: BoothService,
    private time: TimeService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.boothCount = this.storage.get<number>('booth_count', 3);
    this.factor = this.time.factor;
    this.shiftActive = this.attendance.isShiftActive();
  }

  applyBooths(): void {
    const count = Math.max(1, Math.min(10, this.boothCount));
    this.boothSvc.configure(count);
  }

  applyFactor(): void {
    const f = Math.max(1, Math.min(600, this.factor));
    this.time.setFactor(f);
  }

  startShift(): void {
    this.time.resetToday();
    this.attendance.startShift();
    this.shiftActive = true;
  }

  endShift(): void {
    this.attendance.endShift();
    this.shiftActive = false;
  }

  clearData(): void {
    this.attendance.endShift();
    this.storage.clear();
    window.location.reload();
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
