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
  service: string;
  date: string;
  time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
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

// ✅ Transação atômica com fallback seguro
export const tryBookSlot = async (
  slotId: string,
  newData: QueueItem
): Promise<boolean> => {
  const slotRef = doc(db, "barbershop", "queue", "items", slotId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(slotRef);

      // Se a vaga não existir, cria automaticamente
      if (!snapshot.exists()) {
        transaction.set(slotRef, {
          ...newData,
          id: slotId,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return true;
      }

      const slot = snapshot.data() as QueueItem;
      // Se já tiver nome, alguém reservou primeiro
      if (slot.name && slot.name.trim() !== "") {
        throw new Error("Vaga já ocupada.");
      }

      // Se livre, reservar
      transaction.set(slotRef, {
        ...newData,
        id: slotId,
        addedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return true;
    });

    console.log(`[✅ Reserva confirmada] Vaga ${slotId} gravada com sucesso.`);
    return result;
  } catch (err) {
    console.warn(`[⚠️ CONFLITO] Vaga ${slotId} já foi ocupada.`);
    return false;
  }
};

// ✅ Salvar um único item da fila
export const saveQueueItem = async (item: QueueItem): Promise<void> => {
  const queueCollection = collection(db, "barbershop", "queue", "items");
  const id = item.id?.toString() || String(Date.now());
  const itemDoc = doc(queueCollection, id);

  await setDoc(
    itemDoc,
    { ...item, id, updatedAt: Timestamp.now() },
    { merge: true }
  );

  console.log(`[SYNC] Item ${id} salvo/atualizado.`);
};

// ✅ Excluir item da fila
export const deleteQueueItem = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "barbershop", "queue", "items", id));
    console.log(`[DEL] Item ${id} removido.`);
  } catch (err) {
    console.error(`[ERRO] Falha ao excluir item ${id}:`, err);
  }
};

// ✅ Assinatura em tempo real (onSnapshot)
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
