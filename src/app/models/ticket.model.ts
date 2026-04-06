export type TicketType = 'SP' | 'SG' | 'SE';
export type TicketStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'NO_SHOW' | 'DISCARDED';

export interface Ticket {
  id: string;          // YYMMDD-PPSQ, ex: 260405-SP001
  type: TicketType;
  sequence: number;
  issuedAt: number;    // timestamp simulado (ms)
  calledAt?: number;
  completedAt?: number;
  boothId?: number;
  status: TicketStatus;
}
