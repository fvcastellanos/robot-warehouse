import React from 'react';
import { WarehouseState, Item } from '@/lib/astar';

interface StateHistoryProps {
  states: WarehouseState[];     // array de estados desde paso 0..currentStep
  items: Item[];               // lista de inventarios
}

const StateHistory: React.FC<StateHistoryProps> = ({ states, items }) => {
  if (states.length === 0) return null;

  // Función auxiliar para obtener entregados/pendientes
  const getDeliveryInfo = (state: WarehouseState) => {
    let deliveredCount = 0;
    const pending: string[] = [];
    items.forEach((item, idx) => {
      if ((state.deliveredMask & (1 << idx)) !== 0) deliveredCount++;
      else pending.push(item.id);
    });
    return { deliveredCount, pending };
  };

  return (
    <div className="w-80 bg-gray-50 rounded-xl shadow-lg p-3 h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 className="text-xl font-bold mb-3 text-center sticky top-0 bg-gray-50 py-2 text-gray-500">📜 Historial de estados</h2>
      <div className="space-y-2">
        {states.map((state, idx) => {
          const { deliveredCount, pending } = getDeliveryInfo(state);
          const isCurrent = idx === states.length - 1;
          return (
            <div
              key={idx}
              className={`p-2 rounded-md text-sm border-l-4 ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
            >
              <div className="font-mono font-bold text-gray-500">Paso {idx}</div>
              <div className='text-gray-500'>🤖 Robot: ({state.robot.x},{state.robot.y})</div>
              <div className='text-gray-500'>📦 Carga: {state.carried || 'ninguno'}</div>
              <div className='text-gray-500'>✅ Entregados: {deliveredCount}/{items.length}</div>
              <div className="text-xs text-gray-600">⏳ Pendientes: {pending.join(', ') || 'todos'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StateHistory;
