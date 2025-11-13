import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Vehicle, VehicleType } from '../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleData: { name: string; plate: string; type: VehicleType } & { id?: string }) => void;
  vehicle: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSave, vehicle }) => {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<VehicleType>('Prontidão');

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name);
      setPlate(vehicle.plate);
      setType(vehicle.type);
    } else {
      setName('');
      setPlate('');
      setType('Prontidão');
    }
  }, [vehicle, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: vehicle?.id, name, plate, type });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Editar Viatura' : 'Adicionar Nova Viatura'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="vehicle-name" className="block text-sm font-medium text-slate-700">
            Nome da Viatura
          </label>
          <input
            type="text"
            id="vehicle-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Viatura 04 - Delta"
            required
          />
        </div>
        <div>
          <label htmlFor="vehicle-plate" className="block text-sm font-medium text-slate-700">
            Placa
          </label>
          <input
            type="text"
            id="vehicle-plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: ABC-5678"
            required
          />
        </div>
        <div>
          <label htmlFor="vehicle-type" className="block text-sm font-medium text-slate-700">
            Tipo da Viatura
          </label>
          <select
            id="vehicle-type"
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            required
          >
            <option>Poda</option>
            <option>Prontidão</option>
            <option>Comercial</option>
          </select>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
                {vehicle ? 'Salvar Alterações' : 'Adicionar Viatura'}
            </button>
        </div>
      </form>
    </Modal>
  );
};