export type BoothStatus = 'AVAILABLE' | 'BUSY';

export interface Booth {
  id: number;
  name: string;
  status: BoothStatus;
  currentTicketId?: string;
}
