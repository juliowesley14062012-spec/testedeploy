import React, { useState, useEffect } from 'react';
import { useConfig } from './hooks/useConfig';
import { 
  loadQueue, 
  saveQueue, 
  subscribeToQueue,
  loadSettings,
  saveSettings,
  subscribeToSettings
} from './services/firestoreService';
import Header from './components/Header';
import QueueList from './components/QueueList';
import CustomerForm from './components/CustomerForm';
import DeveloperPanel from './components/DeveloperPanel';
import OtherAppointments from './components/OtherAppointments';
import Footer from './components/Footer';
import { QueueItem, ServiceType } from './types';

function App() {
  const { config, loading, error } = useConfig();
  
  const [currentView, setCurrentView] = useState<'home' | 'form' | 'developer' | 'appointments'>('home');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isQueueLocked, setIsQueueLocked] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("Volte mais tarde para agendar seu corte!");
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load initial data from Firestore
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [queueData, settingsData] = await Promise.all([
          loadQueue(),
          loadSettings()
        ]);
        
        setQueue(queueData);
        setIsQueueLocked(settingsData.isLocked);
        setIsShopOpen(settingsData.isShopOpen);
        if (settingsData.closedMessage) {
          setClosedMessage(settingsData.closedMessage);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (isLoadingData) return;
    
    console.log('Setting up Firebase listeners...');

    const unsubscribeQueue = subscribeToQueue((newQueue) => {
      console.log('Queue updated:', newQueue.length, 'items');
      setQueue(newQueue);
    });

    const unsubscribeSettings = subscribeToSettings((newSettings) => {
      console.log('Settings updated:', newSettings);
      setIsQueueLocked(newSettings.isLocked);
      setIsShopOpen(newSettings.isShopOpen);
      if (newSettings.closedMessage) {
        setClosedMessage(newSettings.closedMessage);
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeSettings();
    };
  }, [isLoadingData]);

  // Check for notifications (2 people before)
  useEffect(() => {
    if (!config) return;
    
    const currentServing = queue.findIndex(item => item.name && !item.isCompleted);
    if (currentServing === -1) return;

    const upcomingClients = queue.slice(currentServing + 1).filter(item => item.name && !item.isCompleted);
    
    upcomingClients.forEach((client, index) => {
      if (index === 0) { // Next in line (1 person before)
        // In a real app, this would send a WhatsApp message
        console.log(`Notification sent to ${client.phone}: Está chegando a sua vez na barbearia! Faltam 1 corte, não perca sua vez!`);
      } else if (index === 1) { // 2 people before
        console.log(`Notification sent to ${client.phone}: Está chegando a sua vez na barbearia! Faltam 2 cortes, não perca sua vez!`);
      }
    });
  }, [queue, config]);

  // Handlers
  const handlePositionSelect = (position: number) => {
    const queueItem = queue.find(item => item.id === position);
    if (!queueItem || queueItem.name) return; // Position already taken
    
    setSelectedPosition(position);
    setCurrentView('form');
  };

  const handleFormSubmit = async (data: { name: string; phone: string; service: ServiceType }) => {
    if (selectedPosition === null || !config) return;

    const updatedQueue = queue.map(item => 
      item.id === selectedPosition 
        ? {
            ...item,
            name: data.name,
            phone: data.phone,
            service: data.service,
            timestamp: new Date().toISOString()
          }
        : item
    );

    setQueue(updatedQueue);
    await saveQueue(updatedQueue);

    // Send WhatsApp message (simulated)
    const serviceInfo = `${data.service.name} - R$${data.service.price}`;
    const message = `Novo agendamento - Brayan Barbearia\nPosição: ${selectedPosition}\nNome: ${data.name}\nTelefone: ${data.phone}\nServiço: ${serviceInfo}`;
    
    // In a real app, this would use WhatsApp API
    console.log(`Message sent to ${config.barbershop.phone}:`, message);

    setCurrentView('home');
    setSelectedPosition(null);
  };

  const handleDeveloperLogin = () => {
    setIsDeveloperMode(true);
    setCurrentView('developer');
  };

  const handleDeveloperLogout = () => {
    setIsDeveloperMode(false);
    setCurrentView('home');
  };

  const handleQueueUpdate = async (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    await saveQueue(newQueue);
  };

  const handleSettingsUpdate = async (newSettings: { isLocked: boolean; isShopOpen: boolean }) => {
    setIsQueueLocked(newSettings.isLocked);
    setIsShopOpen(newSettings.isShopOpen);
    await saveSettings(newSettings);
  };

  const handleClosedMessageUpdate = async (message: string) => {
    setClosedMessage(message);
    await saveSettings({ isLocked: isQueueLocked, isShopOpen, closedMessage: message });
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-100 flex items-center justify-center">
        <div className="text-red-700 text-xl font-semibold">Carregando...</div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-100 flex items-center justify-center">
        <div className="text-red-600 text-xl font-semibold">Erro ao carregar configuração: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Header config={config} />
        
        {currentView === 'home' && (
          <>
            <QueueList 
              queue={queue}
              onPositionSelect={handlePositionSelect}
              isLocked={isQueueLocked}
              isShopOpen={isShopOpen}
              closedMessage={closedMessage}
              isDeveloperMode={isDeveloperMode}
            />
            
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleDeveloperLogin}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
              >
                Desenvolvedor
              </button>
            </div>
          </>
        )}

        {currentView === 'form' && (
          <CustomerForm
            position={selectedPosition}
            services={config.services}
            barbershopPhone={config.barbershop.phone}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setCurrentView('home');
              setSelectedPosition(null);
            }}
          />
        )}

        {currentView === 'developer' && isDeveloperMode && (
          <DeveloperPanel
            queue={queue}
            setQueue={handleQueueUpdate}
            isLocked={isQueueLocked}
            setIsLocked={(locked) => handleSettingsUpdate({ isLocked: locked, isShopOpen })}
            isShopOpen={isShopOpen}
            setIsShopOpen={(open) => handleSettingsUpdate({ isLocked: isQueueLocked, isShopOpen: open })}
            closedMessage={closedMessage}
            setClosedMessage={handleClosedMessageUpdate}
            onViewAppointments={() => setCurrentView('appointments')}
            onBackToHome={() => setCurrentView('home')}
            onLogout={handleDeveloperLogout}
          />
        )}

        {currentView === 'appointments' && isDeveloperMode && (
          <OtherAppointments
            services={config.services}
            onBack={() => setCurrentView('developer')}
          />
        )}

        <Footer config={config} />
      </div>
    </div>
  );
}

export default App;