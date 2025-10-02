import React from 'react';
import { Heart, Zap } from 'lucide-react';

interface FooterProps {
  config: {
    barbershop: {
      name: string;
    };
    footer: {
      message: string;
      subtitle: string;
      copyright: string;
    };
  };
}

const Footer: React.FC<FooterProps> = ({ config }) => {
  return (
    <footer className="text-center mt-16 py-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-red-600 mr-2" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600">
            {config.barbershop.name}
          </span>
          <Zap className="w-6 h-6 text-red-600 ml-2 scale-x-[-1]" />
        </div>
        
        <div className="text-gray-800 text-lg mb-4 font-medium">
          {config.footer.message}
        </div>
        
        <div className="text-gray-600 text-sm text-center">
          {config.footer.subtitle}
        </div>
        
        <div className="mt-4 text-gray-500 text-xs">
          {config.footer.copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;