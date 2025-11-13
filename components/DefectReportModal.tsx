import React, { useState } from 'react';
import { Modal } from './Modal';

interface DefectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (defectDescription: string) => void;
}

export const DefectReportModal: React.FC<DefectReportModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Por favor, forneça uma descrição com pelo menos 10 caracteres.');
      return;
    }
    onConfirm(description);
    setDescription('');
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sinalizar Avaria na Viatura">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="defect-description" className="block text-sm font-medium text-slate-700">
            Descrição da Avaria
          </label>
          <textarea
            id="defect-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value.trim().length >= 10) setError('');
            }}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows={4}
            placeholder="Ex: Barulho estranho no motor ao acelerar, pneu dianteiro esquerdo murcho..."
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
                Confirmar Avaria
            </button>
        </div>
      </form>
    </Modal>
  );
};