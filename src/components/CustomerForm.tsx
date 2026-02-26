import React, { useState } from 'react';
import { User, Phone, Zap, ArrowLeft } from 'lucide-react';
import { ServiceType } from '../types';

interface CustomerFormProps {
  position: number | null;
  services: ServiceType[];
  barbershopPhone: string;
  onSubmit: (data: { name: string; phone: string; service: ServiceType }) => Promise<boolean>;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  position,
  services,
  barbershopPhone,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !phone || !selectedService) return;

  setSubmitting(true);

  const success = await onSubmit({ name, phone, service: selectedService });

  setSubmitting(false);

  if (!success) {
    alert('Essa vaga acabou de ser ocupada. Escolha outra.');
    return;
  }

  const serviceInfo = `${selectedService.name} - R$${selectedService.price}`;

  const message = `Olá! Acabei de agendar meu corte na Brayan Barbearia:

📍 Posição: ${position}º
👤 Nome: ${name}
📱 WhatsApp: ${phone}
✂️ Serviço: ${serviceInfo}`;

  const cleanPhone = barbershopPhone.replace(/\D/g, '');

  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

  // ✅ iPhone safe
  window.location.assign(url);
};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/95 rounded-xl border p-8 shadow-lg">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Posição {position}º - Complete seus dados
          </h2>
          <button
            onClick={onCancel}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-semibold text-gray-800 mb-2 block">
              <User className="inline w-5 h-5 mr-2" /> Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-800 mb-2 block">
              <Phone className="inline w-5 h-5 mr-2" /> WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-800 mb-2 block">
              <Zap className="inline w-5 h-5 mr-2" /> Escolha seu serviço
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`p-4 border-2 rounded-lg ${
                    selectedService?.name === service.name
                      ? 'bg-red-100 border-red-500'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{service.name}</span>
                    <span className="text-blue-600 font-bold">R$ {service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || !phone || !selectedService || submitting}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
