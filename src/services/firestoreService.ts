import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

// ===============================
// TYPES
// ===============================
export interface QueueItem {
  id: string;
  name: string;
  phone: string;
  service: string;
  estimatedTime: number;
  addedAt: Timestamp;
  status: "waiting" | "in-service" | "completed";
}

export interface Settings {
  businessName: string;
  services: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
  workingHours: {
    start: string;
    end: string;
  };
  maxQueueSize: number;
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
// QUEUE OPERATIONS
// ===============================
export const loadQueue = async (): Promise<QueueItem[]> => {
  try {
    const queueCollection = collection(db, "barbershop", "queue", "items");
    const snapshot = await getDocs(queueCollection);
    const items: QueueItem[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as QueueItem;
      items.push({ ...data, id: docSnap.id });
    });

    return items.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  } catch (error) {
    console.error("Error loading queue:", error);
    return [];
  }
};

// 🔐 Nova função segura — salva apenas UM item da fila por vez
export const saveQueueItem = async (item: QueueItem): Promise<void> => {
  try {
    const queueCollection = collection(db, "barbershop", "queue", "items");
    const id = item.id || crypto.randomUUID();
    const itemDoc = doc(queueCollection, id);

    await setDoc(
      itemDoc,
      {
        ...item,
        id,
        addedAt: item.addedAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`[SYNC] Fila atualizada: ${id}`);
  } catch (error) {
    console.error("Erro ao salvar item da fila:", error);
  }
};

export const deleteQueueItem = async (id: string): Promise<void> => {
  try {
    const itemDoc = doc(db, "barbershop", "queue", "items", id);
    await deleteDoc(itemDoc);
  } catch (error) {
    console.error("Erro ao excluir item da fila:", error);
  }
};

export const subscribeToQueue = (callback: (items: QueueItem[]) => void) => {
  const queueCollection = collection(db, "barbershop", "queue", "items");

  return onSnapshot(
    queueCollection,
    (snapshot) => {
      const items: QueueItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as QueueItem;
        items.push({ ...data, id: docSnap.id });
      });
      callback(items.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
    },
    (error) => {
      console.error("Error subscribing to queue:", error);
      callback([]);
    }
  );
};

// ===============================
// SETTINGS
// ===============================
export const loadSettings = async (): Promise<Settings> => {
  try {
    const settingsDoc = await getDoc(doc(db, "barbershop", "settings"));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as Settings;
    }

    const defaultSettings: Settings = {
      businessName: "Minha Barbearia",
      services: [
        { name: "Corte Simples", duration: 30, price: 25 },
        { name: "Corte + Barba", duration: 45, price: 35 },
        { name: "Barba", duration: 20, price: 15 },
      ],
      workingHours: { start: "08:00", end: "18:00" },
      maxQueueSize: 10,
    };

    await setDoc(doc(db, "barbershop", "settings"), defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error("Error loading settings:", error);
    throw error;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await setDoc(
      doc(db, "barbershop", "settings"),
      { ...settings, updatedAt: Timestamp.now() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const subscribeToSettings = (callback: (settings: Settings) => void) => {
  return onSnapshot(
    doc(db, "barbershop", "settings"),
    (docSnap) => {
      if (docSnap.exists()) callback(docSnap.data() as Settings);
    },
    (error) => console.error("Error subscribing to settings:", error)
  );
};

// ===============================
// APPOINTMENTS (AGENDAMENTOS)
// ===============================

// 🔄 Carregar todos os agendamentos
export const loadAppointments = async (): Promise<Appointment[]> => {
  try {
    const appointmentsCollection = collection(
      db,
      "barbershop",
      "appointments",
      "items"
    );
    const snapshot = await getDocs(appointmentsCollection);
    const items: Appointment[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Appointment;
      items.push({ ...data, id: docSnap.id });
    });

    return items.sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    );
  } catch (error) {
    console.error("Error loading appointments:", error);
    return [];
  }
};

// ✅ Salvar apenas UM agendamento (evita sobrescrever outros)
export const saveAppointment = async (appointment: Appointment): Promise<void> => {
  try {
    const appointmentsCollection = collection(
      db,
      "barbershop",
      "appointments",
      "items"
    );
    const id = appointment.id || crypto.randomUUID();
    const appointmentDoc = doc(appointmentsCollection, id);

    await setDoc(
      appointmentDoc,
      {
        ...appointment,
        id,
        createdAt: appointment.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`[SYNC] Agendamento salvo com sucesso: ${id}`);
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
  }
};

// ❌ Excluir agendamento
export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const appointmentDoc = doc(
      db,
      "barbershop",
      "appointments",
      "items",
      id
    );
    await deleteDoc(appointmentDoc);
    console.log(`[SYNC] Agendamento removido: ${id}`);
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
  }
};

// 🔁 Assinar atualizações em tempo real
export const subscribeToAppointments = (
  callback: (appointments: Appointment[]) => void
) => {
  const appointmentsCollection = collection(
    db,
    "barbershop",
    "appointments",
    "items"
  );

  return onSnapshot(
    appointmentsCollection,
    (snapshot) => {
      const items: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Appointment;
        items.push({ ...data, id: docSnap.id });
      });

      const sorted = items.sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime()
      );

      console.log(`[SYNC] ${sorted.length} agendamentos sincronizados`);
      callback(sorted);
    },
    (error) => {
      console.error("Error subscribing to appointments:", error);
      callback([]);
    }
  );
};
