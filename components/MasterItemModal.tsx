import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { MasterMaterial, MasterTool } from '../types';

interface MasterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; unit?: string } & { id?: string }) => void;
  item: MasterMaterial | MasterTool | null;
  itemType: 'material' | 'tool';
}

export const MasterItemModal: React.FC<MasterItemModalProps> = ({ isOpen, onClose, onSave, item, itemType }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        if (itemType === 'material' && 'unit' in item) {
          setUnit(item.unit);
        } else {
          setUnit('');
        }
      } else {
        setName('');
        setUnit('unidades');
      }
    }
  }, [item, itemType, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: item?.id, name, ...(itemType === 'material' && { unit }) });
  };

  const title = `${item ? 'Editar' : 'Adicionar Novo'} ${itemType === 'material' ? 'Material' : 'Ferramenta'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item-name" className="block text-sm font-medium text-slate-700">
            Nome do {itemType === 'material' ? 'Material' : 'Ferramenta'}
          </label>
          <input
            type="text"
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        {itemType === 'material' && (
          <div>
            <label htmlFor="item-unit" className="block text-sm font-medium text-slate-700">
              Unidade de Medida
            </label>
            <input
              type="text"
              id="item-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Ex: unidades, metros, kg"
              required
            />
          </div>
        )}
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
            {item ? 'Salvar Alterações' : 'Adicionar Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};