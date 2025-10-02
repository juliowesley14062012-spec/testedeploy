export interface ServiceType {
  name: string;
  price: number;
}

export interface QueueItem {
  id: number;
  name: string;
  phone: string;
  service: ServiceType | null;
  isCompleted: boolean;
  timestamp: string | null;
}

export interface FutureAppointment {
  id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  service: ServiceType;
  notes?: string;
}

export interface QueueSettings {
  isLocked: boolean;
  isShopOpen: boolean;
  closedMessage?: string;
}