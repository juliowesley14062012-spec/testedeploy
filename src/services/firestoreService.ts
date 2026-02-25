import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

// ===============================
// Tipos
// ===============================
export interface QueueItem {
  id: string;
  name?: string;
  phone?: string;
  service?: any;
  timestamp?: string;
  addedAt?: Timestamp;
  updatedAt?: Timestamp;
  isCompleted?: boolean;
}

export interface Settings {
  businessName: string;
  services: Array<{ name: string; duration: number; price: number }>;
  workingHours: { start: string; end: string };
  maxQueueSize: number;
  isLocked?: boolean;
  isShopOpen?: boolean;
  closedMessage?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: any;
  date: string;
  time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  notes?: string;
}

// ===============================
// QUEUE (Fila)
// ===============================
export const loadQueue = async (): Promise<QueueItem[]> => {
  const queueCollection = collection(db, "barbershop", "queue", "items");
  const snapshot = await getDocs(queueCollection);
  const items: QueueItem[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as QueueItem;
    items.push({ ...data, id: docSnap.id });
  });
  return items.sort((a, b) => parseInt(a.id) - parseInt(b.id));
};

export const tryBookSlot = async (
  slotId: string,
  newData: QueueItem
): Promise<boolean> => {
  const slotRef = doc(db, "barbershop", "queue", "items", slotId);

  try {
    const success = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(slotRef);

      if (!snapshot.exists()) {
        transaction.set(slotRef, {
          ...newData,
          id: slotId,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return true;
      }

      const current = snapshot.data() as QueueItem;

      if (current.name && current.name.trim() !== "") {
        throw new Error("Vaga ocupada");
      }

      transaction.set(slotRef, {
        ...newData,
        id: slotId,
        addedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return true;
    });

    return success;
  } catch {
    return false;
  }
};

export const saveQueueItem = async (item: QueueItem): Promise<void> => {
  const queueCollection = collection(db, "barbershop", "queue", "items");
  const id = item.id?.toString() || String(Date.now());
  const itemDoc = doc(queueCollection, id);

  await setDoc(
    itemDoc,
    { ...item, id, updatedAt: Timestamp.now() },
    { merge: true }
  );
};

export const deleteQueueItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "barbershop", "queue", "items", id));
};

export const subscribeToQueue = (callback: (items: QueueItem[]) => void) => {
  const queueCollection = collection(db, "barbershop", "queue", "items");
  return onSnapshot(queueCollection, (snapshot) => {
    const items: QueueItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as QueueItem;
      items.push({ ...data, id: docSnap.id });
    });
    callback(items.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
  });
};

// ===============================
// SETTINGS
// ===============================
export const loadSettings = async (): Promise<Settings> => {
  const ref = doc(db, "barbershop", "settings");
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as Settings;

  const defaults: Settings = {
    businessName: "Brayan Barbearia",
    services: [
      { name: "Corte", duration: 30, price: 25 },
      { name: "Corte + Barba", duration: 45, price: 35 },
    ],
    workingHours: { start: "08:00", end: "18:00" },
    maxQueueSize: 10,
    isLocked: false,
    isShopOpen: true,
    closedMessage: "Volte mais tarde para agendar seu corte!",
  };

  await setDoc(ref, defaults);
  return defaults;
};

export const saveSettings = async (settings: Settings) => {
  await setDoc(doc(db, "barbershop", "settings"), settings, { merge: true });
};

export const subscribeToSettings = (callback: (s: Settings) => void) => {
  return onSnapshot(doc(db, "barbershop", "settings"), (snap) => {
    if (snap.exists()) callback(snap.data() as Settings);
  });
};

// ===============================
// FUTURE APPOINTMENTS (ADICIONADO - NECESSÁRIO PARA O BUILD)
// ===============================
export const loadAppointments = async (): Promise<Appointment[]> => {
  const collectionRef = collection(db, "barbershop", "appointments");
  const snapshot = await getDocs(collectionRef);

  const items: Appointment[] = [];
  snapshot.forEach((docSnap) => {
    items.push({ ...(docSnap.data() as Appointment), id: docSnap.id });
  });

  return items;
};

export const saveAppointments = async (appointments: Appointment[]) => {
  const collectionRef = collection(db, "barbershop", "appointments");

  for (const appointment of appointments) {
    const docRef = doc(collectionRef, appointment.id);
    await setDoc(docRef, appointment, { merge: true });
  }
};

export const subscribeToAppointments = (
  callback: (items: Appointment[]) => void
) => {
  const collectionRef = collection(db, "barbershop", "appointments");

  return onSnapshot(collectionRef, (snapshot) => {
    const items: Appointment[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as Appointment), id: docSnap.id });
    });
    callback(items);
  });
};
