import React from 'react';

interface ControlPanelProps {
  gridSize: number; setGridSize: (s: number) => void;
  selectedTool: string; setSelectedTool: (t: string) => void;
  onSolve: () => void; status: string;
  solution: any[] | null; currentStep: number;
  onNext: () => void; onPrev: () => void; onPlay: () => void; onPause: () => void; onReset: () => void; isPlaying: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  gridSize, setGridSize, selectedTool, setSelectedTool, onSolve, status,
  solution, currentStep, onNext, onPrev, onPlay, onPause, onReset, isPlaying,
}) => {
  const tools = [
    { id: 'robot', label: '🤖 Robot', color: 'bg-blue-500' },
    { id: 'item', label: '📦 Inventario', color: 'bg-yellow-500' },
    { id: 'goal', label: '⭐ Meta', color: 'bg-green-500' },
    { id: 'obstacle', label: '🧱 Obstáculo', color: 'bg-gray-600' },
    { id: 'erase', label: '✖️ Borrar', color: 'bg-red-500' },
  ];

  return (
    <>
      <h1 className="text-4xl font-bold mb-2 text-blue-800">🤖 Robot Amazon – A* con metas visuales</h1>
      <div className="bg-white p-4 rounded-xl shadow-md w-full mb-4">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label className="font-semibold mr-2 text-gray-500">Tamaño:</label>
            <input type="number" min="2" max="8" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value) || 4)} className="border rounded px-2 py-1 w-20 text-center text-gray-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {tools.map(tool => (
              <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedTool === tool.id ? tool.color + ' text-white ring-2 ring-offset-2 ring-black' : 'bg-gray-200 text-gray-500'}`}>
                {tool.label}
              </button>
            ))}
          </div>
          <button onClick={onSolve} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">🚀 Resolver</button>
          <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded text-gray-500">{status}</div>
        </div>

        {solution && (
          <div className="flex gap-3 items-center border-t pt-3">
            <button onClick={onPrev} disabled={currentStep === 0} className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50">◀</button>
            <span className="font-mono text-gray-500">Paso {currentStep} / {solution.length}</span>
            <button onClick={onNext} disabled={currentStep === solution.length} className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50">▶</button>
            {!isPlaying ? (
              <button onClick={onPlay} className="px-4 py-1 bg-blue-600 text-white rounded">▶ Reproducir</button>
            ) : (
              <button onClick={onPause} className="px-4 py-1 bg-red-600 text-white rounded">⏸ Pausa</button>
            )}
            <button onClick={onReset} className="px-4 py-1 bg-yellow-600 text-white rounded">⟳ Reiniciar</button>
            <span className="text-xs text-gray-500 ml-4">Secuencia: {solution.join(' → ')}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ControlPanel;
