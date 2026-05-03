import React from 'react';
import { Item, WarehouseState } from '@/lib/astar';

interface GridProps {
  size: number;
  currentState: WarehouseState | null; // null si no hay solución o aún no se ha resuelto
  items: Item[];  // lista completa con sus metas
  obstacles: Set<string>;
  onCellClick: (row: number, col: number) => void;
}

const Grid: React.FC<GridProps> = ({ size, currentState, items, obstacles, onCellClick }) => {
  // Mapa de meta por celda (para mostrar ⭐ M1)
  const goalMap = new Map<string, string>();
  items.forEach(item => {
    const key = `${item.goal.x},${item.goal.y}`;
    goalMap.set(key, item.id);
  });

  // Mapa de inventario en cada celda (solo los no entregados se muestran en su posición inicial)
  const itemAtCell = new Map<string, Item>();
  if (currentState) {
    // Solo los inventarios NO entregados aparecen en su start
    items.forEach((item, idx) => {
      const isDelivered = (currentState.deliveredMask & (1 << idx)) !== 0;
      if (!isDelivered) {
        const key = `${item.start.x},${item.start.y}`;
        itemAtCell.set(key, item);
      }
    });
  } else {
    // Sin solución, mostramos todos los inventarios en su start
    items.forEach(item => {
      const key = `${item.start.x},${item.start.y}`;
      itemAtCell.set(key, item);
    });
  }

  const getCellContent = (row: number, col: number): { content: string; bg: string } => {
    const key = `${row},${col}`;

    const isObstacle = obstacles.has(key);
    if (isObstacle) return { content: '🧱', bg: 'bg-gray-700' };

    // Robot
    if (currentState && currentState.robot.x === row && currentState.robot.y === col) {
      let robotLabel = '🤖';
      if (currentState.carried) robotLabel += ` (${currentState.carried})`;
      return { content: robotLabel, bg: 'bg-blue-400' };
    }

    // Inventario en su posición inicial (si no entregado)
    const itemHere = itemAtCell.get(key);
    if (itemHere) {
      // Si el robot está encima, ya se mostró robot, no debería pasar
      return { content: `📦 ${itemHere.id}`, bg: 'bg-yellow-300' };
    }

    // Meta de algún inventario
    const goalId = goalMap.get(key);
    if (goalId) {
      // Si el inventario ya fue entregado, mostramos check
      let delivered = false;
      if (currentState) {
        const idx = items.findIndex(i => i.id === goalId);
        if (idx !== -1 && (currentState.deliveredMask & (1 << idx)) !== 0) delivered = true;
      }
      if (delivered) return { content: `✅ ${goalId}`, bg: 'bg-green-300' };
      else return { content: `⭐ ${goalId}`, bg: 'bg-green-200' };
    }

    return { content: '', bg: 'bg-white' };
  };

  return (
    <div
      className="grid gap-1 bg-gray-800 p-4 rounded-xl shadow-lg"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 80px))` }}
    >
      {Array(size).fill(null).map((_, row) =>
        Array(size).fill(null).map((_, col) => {
          const { content, bg } = getCellContent(row, col);
          return (
            <div
              key={`${row},${col}`}
              className={`w-20 h-20 flex items-center justify-center border-2 border-gray-400 text-sm font-bold cursor-pointer transition-all hover:scale-105 ${bg}`}
              onClick={() => onCellClick(row, col)}
            >
              {content}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Grid;
