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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2654') {
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
    }
    setPassword('');
  };

  const handleShopToggle = () => {
    if (isShopOpen) {
      // Fechando a barbearia - permitir editar mensagem
      setEditingMessage(true);
      setTempMessage(closedMessage);
    }
    setIsShopOpen(!isShopOpen);
  };

  const saveClosedMessage = () => {
    setClosedMessage(tempMessage);
    setEditingMessage(false);
  };

  const cancelEditMessage = () => {
    setTempMessage(closedMessage);
    setEditingMessage(false);
  };
  const deleteCustomer = (id: number) => {
    if (confirm('Tem certeza que deseja remover este cliente?')) {
      const updatedQueue = queue.map(item => 
        item.id === id 
          ? { ...item, name: '', phone: '', service: null, isCompleted: false, timestamp: null }
          : item
      );
      setQueue(updatedQueue);
    }
  };

  const moveUp = (id: number) => {
    const currentIndex = queue.findIndex(item => item.id === id);
    if (currentIndex > 0) {
      const newQueue = [...queue];
      [newQueue[currentIndex], newQueue[currentIndex - 1]] = [newQueue[currentIndex - 1], newQueue[currentIndex]];
      // Update IDs to match positions
      newQueue.forEach((item, index) => {
        item.id = index + 1;
      });
      setQueue(newQueue);
    }
  };

  const moveDown = (id: number) => {
    const currentIndex = queue.findIndex(item => item.id === id);
    if (currentIndex < queue.length - 1) {
      const newQueue = [...queue];
      [newQueue[currentIndex], newQueue[currentIndex + 1]] = [newQueue[currentIndex + 1], newQueue[currentIndex]];
      // Update IDs to match positions
      newQueue.forEach((item, index) => {
        item.id = index + 1;
      });
      setQueue(newQueue);
    }
  };

  const markCompleted = (id: number) => {
    const updatedQueue = queue.map(item =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setQueue(updatedQueue);
  };

  const changeQueueSize = () => {
    const newSize = parseInt(prompt('Número total de vagas desejadas:') || queue.length.toString());
    if (newSize > 0 && newSize !== queue.length) {
      let newQueue = [...queue];
      
      if (newSize > queue.length) {
        // Add more slots
        const slotsToAdd = newSize - queue.length;
        const newSlots = Array.from({ length: slotsToAdd }, (_, i) => ({
          id: queue.length + i + 1,
          name: '',
          phone: '',
          service: null,
          isCompleted: false,
          timestamp: null
        }));
        newQueue = [...queue, ...newSlots];
      } else {
        // Remove slots (only empty ones)
        newQueue = queue.slice(0, newSize);
      }
      
      // Update IDs to match positions
      newQueue.forEach((item, index) => {
        item.id = index + 1;
      });
      
      setQueue(newQueue);
    }
  };

  const addMoreSlots = () => {
    const slotsToAdd = parseInt(prompt('Quantas vagas adicionar?') || '0');
    if (slotsToAdd > 0) {
      const newSlots = Array.from({ length: slotsToAdd }, (_, i) => ({
        id: queue.length + i + 1,
        name: '',
        phone: '',
        service: null,
        isCompleted: false,
        timestamp: null
      }));
      setQueue([...queue, ...newSlots]);
    }
  };

  const clearCompletedSlots = () => {
    if (confirm('Limpar todos os slots concluídos?')) {
      const updatedQueue = queue.map(item =>
        item.isCompleted
          ? { ...item, name: '', phone: '', service: null, isCompleted: false, timestamp: null }
          : item
      );
      setQueue(updatedQueue);
    }
  };

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
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="Digite a senha"
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
            >
              Entrar
            </button>
          </form>

          <button
            onClick={onBackToHome}
            className="w-full mt-4 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Painel do Desenvolvedor</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShopToggle}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isShopOpen
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isShopOpen ? 'Barbearia Aberta' : 'Barbearia Fechada'}
            </button>

            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isLocked
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {isLocked ? 'Fila Travada (Só Dev)' : 'Travar Fila'}
            </button>

            <button
              onClick={onViewAppointments}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Outros Agendamentos
            </button>

            <button
              onClick={onBackToHome}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Início
            </button>

            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>

        {/* Edit Closed Message */}
        {editingMessage && (
          <div className="mb-8 bg-yellow-50 rounded-lg p-6 border border-yellow-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Mensagem de Fechado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-800 font-medium mb-2">Mensagem que aparece quando a barbearia está fechada:</label>
                <input
                  type="text"
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Digite a mensagem..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={saveClosedMessage}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salvar Mensagem
                </button>
                
                <button
                  onClick={cancelEditMessage}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={changeQueueSize}
            className="flex items-center justify-center px-4 py-3 bg-green-100 border border-green-500 text-green-800 rounded-lg hover:bg-green-200 transition-all font-semibold"
          >
            <Hash className="w-5 h-5 mr-2" />
            Número de Vagas
          </button>

          <button
            onClick={clearCompletedSlots}
            className="flex items-center justify-center px-4 py-3 bg-orange-100 border border-orange-500 text-orange-800 rounded-lg hover:bg-orange-200 transition-all font-semibold"
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

        {/* Queue Management */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar Fila</h3>
          
          {queue.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                item.isCompleted
                  ? 'bg-green-100 border-green-500'
                  : item.name
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-gray-50 border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-800 font-bold text-lg">
                      {item.id}º
                    </span>
                    <div>
                      <div className="text-gray-800 font-medium">
                        {item.name || 'Vago'}
                      </div>
                      {item.phone && (
                        <div className="text-gray-600 text-sm">{item.phone}</div>
                      )}
                      {item.service && (
                        <div className="text-blue-600 text-sm">
                          {item.service.name} - R$ {item.service.price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {item.name && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveUp(item.id)}
                      disabled={index === 0}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => moveDown(item.id)}
                      disabled={index === queue.length - 1}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => markCompleted(item.id)}
                      className={`p-2 rounded transition-colors ${
                        item.isCompleted
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={item.isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                    >
                      {item.isCompleted ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => deleteCustomer(item.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Remover cliente"
                    >
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