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
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Types
export interface QueueItem {
  id: string;
  name: string;
  phone: string;
  service: string;
  estimatedTime: number;
  addedAt: Timestamp;
  status: 'waiting' | 'in-service' | 'completed';
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
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

// Queue operations
export const loadQueue = async (): Promise<QueueItem[]> => {
  try {
    const queueCollection = collection(db, 'barbershop', 'queue', 'items');
    const snapshot = await getDocs(queueCollection);

    const items: QueueItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as QueueItem;
      items.push({
        ...data,
        id: typeof data.id === 'string' ? parseInt(data.id) : data.id
      });
    });

    return items.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error('Error loading queue:', error);
    return [];
  }
};

export const saveQueue = async (items: QueueItem[]): Promise<void> => {
  try {
    if (!items || items.length === 0) {
      console.warn('Tentativa de salvar lista vazia ignorada');
      return;
    }

    const queueCollection = collection(db, 'barbershop', 'queue', 'items');

    // Ensure all items have valid IDs
    const validItems = items.map((item) => ({
      ...item,
      id: item.id || Date.now().toString()
    }));

    // Get all existing document IDs to identify deletions
    const existingSnapshot = await getDocs(queueCollection);
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    const newIds = new Set(validItems.map(item => item.id.toString()));

    // Delete queue items that were removed
    const deletePromises = Array.from(existingIds)
      .filter(id => !newIds.has(id))
      .map(id => deleteDoc(doc(queueCollection, id)));

    // Save/update queue items
    const savePromises = validItems.map((item) => {
      const itemDoc = doc(queueCollection, item.id.toString());
      return setDoc(itemDoc, {
        ...item,
        updatedAt: Timestamp.now()
      });
    });

    await Promise.all([...savePromises, ...deletePromises]);
    console.log(`Queue salva com sucesso: ${validItems.length} itens sincronizados`);
  } catch (error) {
    console.error('Erro ao salvar fila:', error);
    throw error;
  }
};

export const subscribeToQueue = (callback: (items: QueueItem[]) => void) => {
  const queueCollection = collection(db, 'barbershop', 'queue', 'items');

  return onSnapshot(queueCollection, (snapshot) => {
    const items: QueueItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as QueueItem;
      items.push({
        ...data,
        id: typeof data.id === 'string' ? parseInt(data.id) : data.id
      });
    });

    const sorted = items.sort((a, b) => a.id - b.id);
    console.log(`[SYNC] Fila atualizada em tempo real: ${sorted.length} itens`);
    callback(sorted);
  }, (error) => {
    console.error('[ERRO] Falha ao escutar fila:', error);
    callback([]);
  });
};

// Settings operations
export const loadSettings = async (): Promise<Settings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'barbershop', 'settings'));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as Settings;
    }
    
    // Default settings
    const defaultSettings: Settings = {
      businessName: 'Minha Barbearia',
      services: [
        { name: 'Corte Simples', duration: 30, price: 25 },
        { name: 'Corte + Barba', duration: 45, price: 35 },
        { name: 'Barba', duration: 20, price: 15 }
      ],
      workingHours: {
        start: '08:00',
        end: '18:00'
      },
      maxQueueSize: 10
    };
    
    await setDoc(doc(db, 'barbershop', 'settings'), defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    throw error;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await updateDoc(doc(db, 'barbershop', 'settings'), {
      ...settings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, 'barbershop', 'settings'), {
        ...settings,
        updatedAt: Timestamp.now()
      });
    } catch (createError) {
      console.error('Error creating settings document:', createError);
      throw createError;
    }
  }
};

export const subscribeToSettings = (callback: (settings: Settings) => void) => {
  return onSnapshot(doc(db, 'barbershop', 'settings'), async (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Settings);
    } else {
      // Load default settings if document doesn't exist
      try {
        const defaultSettings = await loadSettings();
        callback(defaultSettings);
      } catch (error) {
        console.error('Error loading default settings:', error);
      }
    }
  }, (error) => {
    console.error('Error subscribing to settings:', error);
  });
};

// Appointments operations
export const loadAppointments = async (): Promise<Appointment[]> => {
  try {
    const appointmentsCollection = collection(db, 'barbershop', 'appointments', 'items');
    const snapshot = await getDocs(appointmentsCollection);

    const items: Appointment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        service: data.service,
        date: data.date,
        time: data.time,
        status: data.status || 'scheduled',
        createdAt: data.createdAt || Timestamp.now()
      } as Appointment);
    });

    return items.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });
  } catch (error) {
    console.error('Error loading appointments:', error);
    return [];
  }
};

export const saveAppointments = async (appointments: Appointment[]): Promise<void> => {
  try {
    if (!appointments || appointments.length === 0) {
      console.warn('Tentativa de salvar lista vazia ignorada');
      return;
    }

    const appointmentsCollection = collection(db, 'barbershop', 'appointments', 'items');

    // Ensure all items have valid IDs
    const validAppointments = appointments.map((appointment) => ({
      ...appointment,
      id: appointment.id || Date.now().toString()
    }));

    // Get all existing document IDs to identify deletions
    const existingSnapshot = await getDocs(appointmentsCollection);
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    const newIds = new Set(validAppointments.map(apt => apt.id));

    // Delete appointments that were removed
    const deletePromises = Array.from(existingIds)
      .filter(id => !newIds.has(id))
      .map(id => deleteDoc(doc(appointmentsCollection, id)));

    // Save/update appointments
    const savePromises = validAppointments.map((appointment) => {
      const appointmentDoc = doc(appointmentsCollection, appointment.id);
      return setDoc(appointmentDoc, {
        ...appointment,
        updatedAt: Timestamp.now()
      });
    });

    await Promise.all([...savePromises, ...deletePromises]);
    console.log(`Agendamentos salvos com sucesso: ${validAppointments.length} itens sincronizados`);
  } catch (error) {
    console.error('Erro ao salvar agendamentos:', error);
    throw error;
  }
};

export const subscribeToAppointments = (callback: (appointments: Appointment[]) => void) => {
  const appointmentsCollection = collection(db, 'barbershop', 'appointments', 'items');

  return onSnapshot(appointmentsCollection, (snapshot) => {
    const items: Appointment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        service: data.service,
        date: data.date,
        time: data.time,
        status: data.status || 'scheduled',
        createdAt: data.createdAt || Timestamp.now()
      } as Appointment);
    });

    const sorted = items.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

    console.log(`[SYNC] Agendamentos atualizados em tempo real: ${sorted.length} itens`);
    callback(sorted);
  }, (error) => {
    console.error('[ERRO] Falha ao escutar agendamentos:', error);
    callback([]);
  });
};
