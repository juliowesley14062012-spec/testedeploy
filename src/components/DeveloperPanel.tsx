import React, { useState } from 'react';
import {
  Settings,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Hash,
  Calendar,
  LogOut,
  Home
} from 'lucide-react';
import { QueueItem } from '../types';
import { saveQueueItem, deleteQueueItem } from '../services/firestoreService';

interface DeveloperPanelProps {
  queue: QueueItem[];
  setQueue: (queue: QueueItem[]) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
  closedMessage: string;
  setClosedMessage: (message: string) => void;
  onViewAppointments: () => void;
  onBackToHome: () => void;
  onLogout: () => void;
}

const DeveloperPanel: React.FC<DeveloperPanelProps> = ({
  queue,
  setQueue,
  isLocked,
  setIsLocked,
  isShopOpen,
  setIsShopOpen,
  closedMessage,
  setClosedMessage,
  onViewAppointments,
  onBackToHome,
  onLogout
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editingMessage, setEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(closedMessage);

  // === LOGIN ===
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2654') {
      setIsAuthenticated(true);
      console.log('[DEV] Login autorizado.');
    } else {
      alert('Senha incorreta!');
    }
    setPassword('');
  };

  // === CONTROLE DE LOJA ===
  const handleShopToggle = () => {
    if (isShopOpen) {
      setEditingMessage(true);
      setTempMessage(closedMessage);
    }
    setIsShopOpen(!isShopOpen);
  };

  const saveClosedMessage = () => {
    setClosedMessage(tempMessage);
    setEditingMessage(false);
    console.log('[DEV] Mensagem de loja fechada atualizada.');
  };

  const cancelEditMessage = () => {
    setTempMessage(closedMessage);
    setEditingMessage(false);
  };

  // === AÇÕES NA FILA ===
  const deleteCustomer = async (id: number | string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;
    await deleteQueueItem(id.toString());
    setQueue(queue.map(q => (q.id === id ? { ...q, name: '', phone: '', service: null, isCompleted: false } : q)));
    console.log(`[DEV] Cliente ${id} removido.`);
  };

  const moveUp = async (id: number | string) => {
    const idx = queue.findIndex(item => item.id === id);
    if (idx <= 0) return;
    const newQueue = [...queue];
    [newQueue[idx - 1], newQueue[idx]] = [newQueue[idx], newQueue[idx - 1]];
    newQueue.forEach((item, i) => (item.id = (i + 1).toString()));
    setQueue(newQueue);
    await Promise.all(newQueue.map(item => saveQueueItem(item)));
  };

  const moveDown = async (id: number | string) => {
    const idx = queue.findIndex(item => item.id === id);
    if (idx < 0 || idx === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[idx + 1], newQueue[idx]] = [newQueue[idx], newQueue[idx + 1]];
    newQueue.forEach((item, i) => (item.id = (i + 1).toString()));
    setQueue(newQueue);
    await Promise.all(newQueue.map(item => saveQueueItem(item)));
  };

  const markCompleted = async (id: number | string) => {
    const updatedQueue = queue.map(item =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setQueue(updatedQueue);
    const target = updatedQueue.find(item => item.id === id);
    if (target) await saveQueueItem(target);
  };

  const changeQueueSize = async () => {
    const newSize = parseInt(prompt('Número total de vagas desejadas:') || queue.length.toString());
    if (newSize <= 0) return;

    let newQueue = [...queue];
    if (newSize > queue.length) {
      const addCount = newSize - queue.length;
      const newSlots = Array.from({ length: addCount }, (_, i) => ({
        id: (queue.length + i + 1).toString(),
        name: '',
        phone: '',
        service: null,
        isCompleted: false
      }));
      newQueue = [...queue, ...newSlots];
    } else {
      newQueue = queue.slice(0, newSize);
    }

    setQueue(newQueue);
    await Promise.all(newQueue.map(item => saveQueueItem(item)));
    console.log(`[DEV] Tamanho da fila atualizado: ${newSize}`);
  };

  const clearCompletedSlots = async () => {
    if (!confirm('Limpar todos os slots concluídos?')) return;
    const updated = queue.map(item =>
      item.isCompleted
        ? { ...item, name: '', phone: '', service: null, isCompleted: false }
        : item
    );
    setQueue(updated);
    await Promise.all(updated.map(item => saveQueueItem(item)));
  };

  // === LOGIN SCREEN ===
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <Settings className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Painel do Desenvolvedor</h2>
            <p className="text-gray-600 mt-2">Digite a senha para acessar</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-4"
              placeholder="Digite a senha"
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800"
            >
              Entrar
            </button>
          </form>

          <button
            onClick={onBackToHome}
            className="w-full mt-4 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // === MAIN PANEL ===
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/95 rounded-xl border p-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Painel do Desenvolvedor</h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShopToggle}
              className={`px-4 py-2 rounded-lg font-semibold ${
                isShopOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isShopOpen ? 'Barbearia Aberta' : 'Barbearia Fechada'}
            </button>

            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold ${
                isLocked ? 'bg-red-600' : 'bg-blue-600'
              } text-white hover:opacity-90`}
            >
              {isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {isLocked ? 'Fila Travada (Dev)' : 'Travar Fila'}
            </button>

            <button
              onClick={onViewAppointments}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Outros Agendamentos
            </button>

            <button
              onClick={onBackToHome}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Início
            </button>

            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>

        {editingMessage && (
          <div className="mb-8 bg-yellow-50 rounded-lg p-6 border border-yellow-300">
            <h3 className="text-lg font-semibold mb-4">Editar Mensagem de Fechado</h3>
            <input
              type="text"
              value={tempMessage}
              onChange={(e) => setTempMessage(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-4"
              placeholder="Digite a mensagem..."
            />
            <div className="flex gap-3">
              <button
                onClick={saveClosedMessage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Salvar
              </button>
              <button
                onClick={cancelEditMessage}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={changeQueueSize}
            className="flex items-center justify-center px-4 py-3 bg-green-100 border border-green-500 rounded-lg hover:bg-green-200"
          >
            <Hash className="w-5 h-5 mr-2" />
            Número de Vagas
          </button>

          <button
            onClick={clearCompletedSlots}
            className="flex items-center justify-center px-4 py-3 bg-orange-100 border border-orange-500 rounded-lg hover:bg-orange-200"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Limpar Concluídos
          </button>

          <div className="bg-blue-100 border border-blue-500 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-800">
              {queue.filter(item => item.name).length}/{queue.length}
            </div>
            <div className="text-blue-700 text-sm font-semibold">Ocupadas/Total</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar Fila</h3>

          {queue.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                item.isCompleted
                  ? 'bg-green-100 border-green-500'
                  : item.name
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  <span className="text-gray-800 font-bold text-lg">{item.id}º </span>
                  <span>{item.name || 'Vago'}</span>
                  {item.service && (
                    <span className="text-blue-600 text-sm ml-2">
                      {item.service.name} - R$ {item.service.price}
                    </span>
                  )}
                </div>

                {item.name && (
                  <div className="flex gap-2">
                    <button onClick={() => moveUp(item.id)} className="p-2 bg-blue-600 text-white rounded">
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveDown(item.id)} className="p-2 bg-blue-600 text-white rounded">
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => markCompleted(item.id)} className="p-2 bg-green-600 text-white rounded">
                      {item.isCompleted ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteCustomer(item.id)} className="p-2 bg-red-600 text-white rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;
