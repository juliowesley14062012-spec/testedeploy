import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
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
    const queueDoc = await getDoc(doc(db, 'barbershop', 'queue'));
    if (queueDoc.exists()) {
      const data = queueDoc.data();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading queue:', error);
    return [];
  }
};

export const saveQueue = async (items: QueueItem[]): Promise<void> => {
  try {
    await updateDoc(doc(db, 'barbershop', 'queue'), {
      items,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving queue:', error);
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, 'barbershop', 'queue'), {
        items,
        updatedAt: Timestamp.now()
      });
    } catch (createError) {
      console.error('Error creating queue document:', createError);
      throw createError;
    }
  }
};

export const subscribeToQueue = (callback: (items: QueueItem[]) => void) => {
  return onSnapshot(doc(db, 'barbershop', 'queue'), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.items || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to queue:', error);
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
    const appointmentsDoc = await getDoc(doc(db, 'barbershop', 'appointments'));
    if (appointmentsDoc.exists()) {
      const data = appointmentsDoc.data();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading appointments:', error);
    return [];
  }
};

export const saveAppointments = async (appointments: Appointment[]): Promise<void> => {
  try {
    await updateDoc(doc(db, 'barbershop', 'appointments'), {
      items: appointments,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving appointments:', error);
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, 'barbershop', 'appointments'), {
        items: appointments,
        updatedAt: Timestamp.now()
      });
    } catch (createError) {
      console.error('Error creating appointments document:', createError);
      throw createError;
    }
  }
};

export const subscribeToAppointments = (callback: (appointments: Appointment[]) => void) => {
  return onSnapshot(doc(db, 'barbershop', 'appointments'), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.items || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to appointments:', error);
    callback([]);
  });
};