import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Material } from '../types';

interface UseMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  onConfirm: (material: Material, quantity: number) => void;
}

export const UseMaterialModal: React.FC<UseMaterialModalProps> = ({ isOpen, onClose, material, onConfirm }) => {
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('1');
      setError('');
    }
  }, [isOpen]);

  if (!material) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity, 10);

    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Por favor, insira uma quantidade válida maior que 0.');
      return;
    }

    if (numQuantity > material.quantity) {
      setError(`A quantidade não pode exceder o estoque disponível (${material.quantity}).`);
      return;
    }

    onConfirm(material, numQuantity);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Usar ${material.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-slate-600">
          <p>
            Estoque Disponível: <span className="font-bold">{material.quantity} {material.unit}</span>
          </p>
        </div>
        <div>
          <label htmlFor="quantity-used" className="block text-sm font-medium text-slate-700">
            Quantidade Utilizada
          </label>
          <input
            type="number"
            id="quantity-used"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError(''); // Clear error on change
            }}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: 5"
            min="1"
            max={material.quantity}
            required
            autoFocus
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
                Confirmar Uso
            </button>
        </div>
      </form>
    </Modal>
  );
};