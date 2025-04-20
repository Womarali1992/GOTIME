
export type Court = {
  id: string;
  name: string;
  location: string;
  indoor: boolean;
};

export type TimeSlot = {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  date: string;
  available: boolean;
};

export type Reservation = {
  id: string;
  timeSlotId: string;
  courtId: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  players: number;
  createdAt: string;
};
