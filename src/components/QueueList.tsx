import React from 'react';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { QueueItem } from '../types';

interface QueueListProps {
  queue: QueueItem[];
  onPositionSelect: (position: number) => void;
  isLocked: boolean;
  isShopOpen: boolean;
  closedMessage?: string;
  isDeveloperMode?: boolean;
}

const QueueList: React.FC<QueueListProps> = ({ 
  queue, 
  onPositionSelect, 
  isLocked, 
  isShopOpen,
  closedMessage = "Volte mais tarde para agendar seu corte!",
  isDeveloperMode = false
}) => {
  const currentServing = queue.findIndex(item => item.name && !item.isCompleted);
  const nextInLine = currentServing >= 0 ? currentServing + 1 : -1;

  const getPositionStyle = (index: number, item: QueueItem) => {
    if (item.isCompleted) {
      return 'bg-green-100 border-green-500 text-green-800';
    } else if (index === currentServing) {
      return 'bg-red-200 border-red-500 text-red-800 animate-pulse shadow-lg shadow-red-500/30';
    } else if (index === nextInLine) {
      return 'bg-blue-200 border-blue-500 text-blue-800 shadow-lg shadow-blue-500/30';
    } else if (item.name) {
      return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    } else {
      // Check if user can select this position
      const canSelect = isDeveloperMode || (!isLocked && isShopOpen);
      return canSelect 
        ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300 cursor-pointer transition-all duration-300'
        : 'bg-white border-gray-400 text-gray-600 cursor-not-allowed opacity-60';
    }
  };

  const getPositionLabel = (index: number, item: QueueItem) => {
    if (item.isCompleted) return 'Concluído';
    if (index === currentServing) return 'Cortando';
    if (index === nextInLine) return 'Próximo';
    return `${index + 1}º`;
  };

  const handlePositionClick = (item: QueueItem, index: number) => {
  if (item.name) {
    alert('Essa vaga já foi ocupada!');
    return;
  }

  const canSelect = isDeveloperMode || (!isLocked && isShopOpen);
  if (canSelect) onPositionSelect(Number(item.id));
};

  if (!isShopOpen) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 backdrop-blur-sm rounded-xl p-8 border border-red-300 max-w-md mx-auto shadow-lg">
          <Clock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">Barbearia Fechada</h2>
          <p className="text-red-600">{closedMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-red-600 mr-3" />
        <h2 className="text-3xl font-bold text-gray-800">Fila de Atendimento</h2>
        {isLocked && (
          <div className="ml-4 px-3 py-1 bg-red-100 rounded-full border border-red-400 text-red-700 text-sm">
            {isDeveloperMode ? 'Travada (Só Dev)' : 'Bloqueada'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-lg border-2 p-4 text-center transition-all duration-300 ${getPositionStyle(index, item)}`}
            onClick={() => handlePositionClick(item, index)}
          >
            <div className="flex items-center justify-center mb-2">
              <span className="text-xs font-semibold opacity-75">
                {getPositionLabel(index, item)}
              </span>
              {item.isCompleted && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
              )}
            </div>
            
            <div className="text-sm font-medium mb-1">
              {item.name || 'Disponível'}
            </div>
            
            {item.service && (
              <div className="text-xs opacity-75 truncate">
                {item.service.name}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-6 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 shadow-md">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-gray-700">Cortando</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Próximo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-white border border-gray-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Disponível</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Na fila</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Concluído</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueList;
