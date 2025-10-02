import React, { useState } from 'react';
import { User, Phone, Zap, ArrowLeft } from 'lucide-react';
import { ServiceType } from '../types';

interface CustomerFormProps {
  position: number | null;
  services: ServiceType[];
  barbershopPhone: string;
  onSubmit: (data: { name: string; phone: string; service: ServiceType }) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  position, 
  services, 
  barbershopPhone, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone && selectedService) {
      // Submit form data first
      onSubmit({ name, phone, service: selectedService });
      
      // Create WhatsApp message
      const serviceInfo = `${selectedService.name} - R$${selectedService.price}`;
      const message = `Olá! Acabei de agendar meu corte na Brayan Barbearia:\n\n📍 Posição na fila: ${position}º\n👤 Nome: ${name}\n📱 WhatsApp: ${phone}\n✂️ Serviço: ${serviceInfo}\n\nPor favor, confirme meu agendamento!`;
      
      // Redirect to WhatsApp after a short delay
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/5521982821521?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, 500);
    }
  };

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Posição {position}º - Complete seus dados
          </h2>
          <button
            onClick={onCancel}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="flex items-center text-gray-800 font-semibold mb-2">
              <User className="w-5 h-5 mr-2" />
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center text-gray-800 font-semibold mb-2">
              <Phone className="w-5 h-5 mr-2" />
              WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />
            <p className="text-gray-600 text-sm mt-1">
              Você receberá notificações quando estiver próximo da sua vez
            </p>
          </div>

          {/* Serviços */}
          <div>
            <label className="flex items-center text-gray-800 font-semibold mb-4">
              <Zap className="w-5 h-5 mr-2" />
              Escolha seu serviço
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                    selectedService?.name === service.name
                      ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-blue-600 font-bold">R$ {service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          {selectedService && (
            <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-gray-800 font-semibold mb-2">Resumo do agendamento:</h3>
              <div className="text-gray-700 space-y-1">
                <p>Posição: {position}º na fila</p>
                <p>Serviço: {selectedService.name}</p>
                <p>Valor: <span className="text-blue-600 font-bold">R$ {selectedService.price}</span></p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!name || !phone || !selectedService}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg"
          >
            Confirmar Agendamento
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;