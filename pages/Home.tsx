import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, User } from '../types';
import { TruckIcon, UserIcon, LogoutIcon, ChevronRightIcon } from '../components/icons';

interface VehicleSelectionProps {
  vehicles: Vehicle[];
  currentUser: User;
  onSelectVehicle: (userId: string, vehicleId: string) => Promise<void>;
  onLogout: () => void;
  users: User[];
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({ vehicles, currentUser, onSelectVehicle, onLogout, users }) => {
  const navigate = useNavigate();

  const handleSelect = async (vehicleId: string) => {
    await onSelectVehicle(currentUser.id, vehicleId);
    navigate(`/vehicle/${vehicleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-dark truncate">Selecionar Viatura</h1>
            <p className="text-sm text-slate-500">Bem-vindo(a), {currentUser.name}!</p>
          </div>
          <button onClick={onLogout} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
            <LogoutIcon className="w-5 h-5 sm:mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="space-y-4">
          {vehicles.map(vehicle => {
            const isFull = vehicle.operatorIds.length >= 3;
            const isCurrentUserAssigned = vehicle.operatorIds.includes(currentUser.id);
            const canSelect = !isFull || isCurrentUserAssigned;
            const assignedOperators = users.filter(u => vehicle.operatorIds.includes(u.id));

            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-lg shadow-md transition-all duration-300 ${canSelect ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-70 bg-slate-50'}`}
              >
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-full ${isCurrentUserAssigned ? 'bg-green-100' : 'bg-green-100'}`}>
                      <TruckIcon className={`w-7 h-7 ${isCurrentUserAssigned ? 'text-green-600' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark">{vehicle.name}</h3>
                      <p className="text-slate-500 text-sm">{vehicle.plate}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                     <div className="flex items-center text-slate-600 bg-slate-100 px-3 py-2 rounded-md" title={assignedOperators.map(op => op.name).join(', ')}>
                        <UserIcon className="w-5 h-5 mr-2 text-slate-400" />
                        <span className="font-medium">{vehicle.operatorIds.length} / 3 Operadores</span>
                    </div>
                    <button
                      onClick={() => handleSelect(vehicle.id)}
                      disabled={!canSelect}
                      className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-secondary rounded-md hover:bg-primary disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCurrentUserAssigned ? 'Continuar' : 'Selecionar'}
                      <ChevronRightIcon className="w-5 h-5 ml-1" />
                    </button>
                  </div>
                </div>
                {isCurrentUserAssigned && (
                    <div className="bg-green-50 text-green-700 text-sm font-medium p-2 text-center rounded-b-lg">
                        Esta é a sua viatura atual.
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-slate-500">
        Desenvolvido por Jonatas Luna - 347612
      </footer>
    </div>
  );
};

export default VehicleSelection;