import React from 'react';
import { Zap, Star } from 'lucide-react';

interface HeaderProps {
  config: {
    barbershop: {
      name: string;
    };
    sections: {
      schedule: {
        title: string;
        description: string;
      };
    };
  };
}

const Header: React.FC<HeaderProps> = ({ config }) => {
  return (
    <div className="text-center mb-12">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-white to-blue-500 rounded-full opacity-30 blur-xl"></div>
        <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 inline-block border border-red-300/50">
          <Zap className="w-16 h-16 text-red-600 mx-auto" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-blue-600 to-red-600 mb-4">
        {config.barbershop.name}
      </h1>
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-red-200 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">{config.sections.schedule.title}</h2>
            <Star className="w-6 h-6 text-red-600 ml-2" />
          </div>
          
          <p className="text-gray-700 text-sm md:text-base leading-relaxed">
            {config.sections.schedule.description.split('.').map((sentence, index, array) => {
              if (index === array.length - 1 && sentence.trim() === '') return null;
              
              const trimmedSentence = sentence.trim();
              if (trimmedSentence.includes('Caso chegue a sua vez')) {
                return (
                  <span key={index}>
                    <strong className="text-red-600"> {trimmedSentence}</strong>
                    {index < array.length - 2 ? '. ' : ''}
                  </span>
                );
              } else if (trimmedSentence.includes('atenção')) {
                return (
                  <span key={index}>
                    <strong className="text-blue-600"> {trimmedSentence}</strong>
                    {index < array.length - 2 ? '. ' : ''}
                  </span>
                );
              } else {
                return (
                  <span key={index}>
                    {trimmedSentence}
                    {index < array.length - 2 ? '. ' : ''}
                  </span>
                );
              }
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-red-200 shadow-md">
          <h3 className="font-semibold text-red-700 text-lg mb-2">Marque a sua vez</h3>
          <p className="text-gray-600 text-sm">Escolha sua posição na fila</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200 shadow-md">
          <h3 className="font-semibold text-blue-700 text-lg mb-2">Preencha os dados</h3>
          <p className="text-gray-600 text-sm">Nome, WhatsApp e serviço</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-red-200 shadow-md">
          <h3 className="font-semibold text-red-700 text-lg mb-2">Acompanhe sua vez</h3>
          <p className="text-gray-600 text-sm">Receba notificações no WhatsApp</p>
        </div>
      </div>
    </div>
  );
};

export default Header;