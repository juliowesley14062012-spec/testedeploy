import React, { useState, useEffect } from 'react';
import { useConfig } from './hooks/useConfig';
import { 
  loadQueue, 
  saveQueueItem,
  deleteQueueItem,
  subscribeToQueue,
  loadSettings,
  saveSettings,
  subscribeToSettings,
  tryBookSlot // 🔥 nova função no firestoreService
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

  // 🔹 Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [queueData, settingsData] = await Promise.all([
          loadQueue(),
          loadSettings()
        ]);
        setQueue(queueData);
        setIsQueueLocked(settingsData?.isLocked ?? false);
        setIsShopOpen(settingsData?.isShopOpen ?? true);
        if (settingsData?.closedMessage) setClosedMessage(settingsData.closedMessage);
      } catch (error) {
        console.error('Erro carregando dados iniciais:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadInitialData();
  }, []);

  // 🔹 Sincronização em tempo real
  useEffect(() => {
    if (isLoadingData) return;
    const unsubQueue = subscribeToQueue((newQueue) => setQueue(newQueue));
    const unsubSettings = subscribeToSettings((newSettings) => {
      setIsQueueLocked(newSettings?.isLocked ?? false);
      setIsShopOpen(newSettings?.isShopOpen ?? true);
      if (newSettings?.closedMessage) setClosedMessage(newSettings.closedMessage);
    });
    return () => {
      unsubQueue();
      unsubSettings();
    };
  }, [isLoadingData]);

  // 🔹 Notificações
  useEffect(() => {
    if (!config) return;
    const currentServing = queue.findIndex(item => item.name && !item.isCompleted);
    if (currentServing === -1) return;
    const upcomingClients = queue.slice(currentServing + 1).filter(item => item.name && !item.isCompleted);
    upcomingClients.forEach((client, index) => {
      if (index === 0) console.log(`Aviso: ${client.phone} está a 1 corte da vez.`);
      else if (index === 1) console.log(`Aviso: ${client.phone} está a 2 cortes da vez.`);
    });
  }, [queue, config]);

  // 🔹 Escolher vaga
  const handlePositionSelect = (position: number) => {
    const queueItem = queue.find(item => Number(item.id) === position);
    if (!queueItem || queueItem.name) return;
    setSelectedPosition(position);
    setCurrentView('form');
  };

  // 🔹 Agendar vaga (com proteção)
  const handleFormSubmit = async (data: { name: string; phone: string; service: ServiceType }) => {
    if (selectedPosition === null || !config) return;

    const itemToSave: QueueItem = {
      id: String(selectedPosition),
      name: data.name,
      phone: data.phone,
      service: data.service,
      timestamp: new Date().toISOString(),
    };

    const success = await tryBookSlot(String(selectedPosition), itemToSave);

    if (!success) {
      alert("Essa vaga acabou de ser ocupada. Escolha outra disponível.");
      setCurrentView("home");
      setSelectedPosition(null);
      return;
    }

    console.log(`Novo agendamento confirmado: ${data.name} - vaga ${selectedPosition}`);
    setCurrentView("home");
    setSelectedPosition(null);
  };

  // 🔹 Painel do desenvolvedor
  const handleDeveloperLogin = () => {
    setIsDeveloperMode(true);
    setCurrentView('developer');
  };

  const handleDeveloperLogout = () => {
    setIsDeveloperMode(false);
    setCurrentView('home');
  };

  // 🔹 Atualizações da fila (painel dev)
  const handleQueueUpdate = async (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    try {
      const existingIds = new Set(queue.map(q => q.id?.toString()));
      const newIds = new Set(newQueue.map(n => n.id?.toString()));
      const toDelete = Array.from(existingIds).filter(id => !newIds.has(id));
      await Promise.all([
        ...newQueue.map(item => saveQueueItem({ ...item, id: String(item.id) })),
        ...toDelete.map(id => deleteQueueItem(id))
      ]);
      console.log(`Fila salva com sucesso: ${newQueue.length} itens.`);
    } catch (err) {
      console.error('Erro ao salvar fila:', err);
    }
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

  // 🔹 Layout
  if (loading || isLoadingData)
    return <div className="min-h-screen flex items-center justify-center text-red-700 text-xl">Carregando...</div>;

  if (error || !config)
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">Erro: {error}</div>;

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
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleDeveloperLogin}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
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
            onCancel={() => { setCurrentView('home'); setSelectedPosition(null); }}
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
