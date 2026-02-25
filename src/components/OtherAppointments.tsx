import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ArrowLeft, Clock, User, Phone } from 'lucide-react';
import { FutureAppointment, ServiceType } from '../types';
import { 
  loadAppointments, 
  subscribeToAppointments,
  deleteAppointment as deleteAppointmentFromFirestore,
  addAppointment
} from '../services/firestoreService';

interface OtherAppointmentsProps {
  services: ServiceType[];
  onBack: () => void;
}

const OtherAppointments: React.FC<OtherAppointmentsProps>> = ({ services, onBack }) => {
  const [appointments, setAppointments] = useState<FutureAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    clientName: '',
    clientPhone: '',
    service: services[0],
    notes: ''
  });

  // Load inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        const appointmentsData = await loadAppointments();
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Realtime
  useEffect(() => {
    if (isLoading) return;

    const unsubscribe = subscribeToAppointments((newAppointments) => {
      setAppointments(newAppointments);
    });

    return () => unsubscribe();
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newAppointment: FutureAppointment = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      service: formData.service,
      date: formData.date,
      time: formData.time,
      status: 'scheduled',
      notes: formData.notes
    };

    await addAppointment(newAppointment);

    setFormData({
      date: '',
      time: '',
      clientName: '',
      clientPhone: '',
      service: services[0],
      notes: ''
    });

    setShowForm(false);
  };

  const deleteAppointment = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteAppointmentFromFirestore(id);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-8 shadow-lg">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-red-600" />
            Outros Agendamentos
          </h2>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </button>

            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum agendamento futuro
              </h3>
              <p className="text-gray-600">
                Clique em "Novo Agendamento" para adicionar
              </p>
            </div>
          ) : (
            sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center text-red-600">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span className="font-medium">
                          {formatDate(appointment.date)}
                        </span>
                      </div>

                      <div className="flex items-center text-blue-600">
                        <Clock className="w-5 h-5 mr-2" />
                        <span className="font-medium">
                          {appointment.time}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center text-gray-800">
                        <User className="w-4 h-4 mr-2 text-gray-600" />
                        <span>{appointment.clientName}</span>
                      </div>

                      <div className="flex items-center text-gray-800">
                        <Phone className="w-4 h-4 mr-2 text-gray-600" />
                        <span>{appointment.clientPhone}</span>
                      </div>

                      <div className="text-blue-600 font-medium">
                        {appointment.service.name} - R$ {appointment.service.price}
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="text-gray-600 text-sm">
                        <strong>Obs:</strong> {appointment.notes}
                      </div>
                    )}

                  </div>

                  <button
                    onClick={() => deleteAppointment(appointment.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors ml-4"
                    title="Excluir agendamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default OtherAppointments;
