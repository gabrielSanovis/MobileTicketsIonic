import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Booth } from '../models/booth.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class BoothService {

  private _booths: Booth[] = [];
  private _booths$ = new BehaviorSubject<Booth[]>([]);
  readonly booths$ = this._booths$.asObservable();

  constructor(private storage: StorageService) {
    this._load();
  }

  private _load(): void {
    const count = this.storage.get<number>('booth_count', 3);
    const saved = this.storage.get<Booth[]>('booths', []);
    if (saved.length === count) {
      this._booths = saved;
    } else {
      this._booths = this._createBooths(count);
      this._persist();
    }
    this._booths$.next([...this._booths]);
  }

  private _createBooths(count: number): Booth[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Guichê ${i + 1}`,
      status: 'AVAILABLE' as const,
      currentTicketId: undefined
    }));
  }

  configure(count: number): void {
    this.storage.set('booth_count', count);
    this._booths = this._createBooths(count);
    this._persist();
  }

  getAll(): Booth[] { return [...this._booths]; }

  getById(id: number): Booth | undefined {
    return this._booths.find(b => b.id === id);
  }

  assignTicket(boothId: number, ticketId: string): void {
    const booth = this._booths.find(b => b.id === boothId);
    if (booth) {
      booth.status = 'BUSY';
      booth.currentTicketId = ticketId;
      this._persist();
    }
  }

  releaseTicket(boothId: number): void {
    const booth = this._booths.find(b => b.id === boothId);
    if (booth) {
      booth.status = 'AVAILABLE';
      booth.currentTicketId = undefined;
      this._persist();
    }
  }

  private _persist(): void {
    this.storage.set('booths', this._booths);
    this._booths$.next([...this._booths]);
  }
}
