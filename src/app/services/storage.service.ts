import { Injectable } from '@angular/core';

const PREFIX = 'mti_';

@Injectable({ providedIn: 'root' })
export class StorageService {

  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }
}
