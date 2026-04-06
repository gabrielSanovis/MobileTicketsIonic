export interface TicketDetail {
  id: string;
  type: string;
  issuedAt: number;
  calledAt?: number;
  completedAt?: number;
  boothId?: number;
  status: string;
  waitMinutes?: number;
  serviceMinutes?: number;
}

export interface DailyReport {
  date: string;         // YYYY-MM-DD
  totalIssued: number;
  totalServed: number;
  totalNoShow: number;
  totalDiscarded: number;
  issuedByType: { SP: number; SG: number; SE: number };
  servedByType: { SP: number; SG: number; SE: number };
  averageTM: number;    // minutos simulados
  details: TicketDetail[];
}
