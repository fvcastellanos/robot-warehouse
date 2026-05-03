'use client';

import { useState, useEffect, useRef } from 'react';
import Grid from '@/components/Grid';
import ControlPanel from '@/components/ControlPanel';
import { solveAStar, type Action, type Item, type Point, type WarehouseState } from '@/lib/astar';
import StateHistory from '@/components/StateHistory';

// Función para obtener el estado después de aplicar 'step' movimientos (idéntica a la anterior)
function getStateAtStep(
  initialState: WarehouseState,
  solution: Action[],
  step: number,
  items: Item[]
): WarehouseState {
  if (step === 0) return initialState;
  let state = { ...initialState };
  for (let i = 0; i < step; i++) {
    const action = solution[i];
    const delta = { U: { x: -1, y: 0 }, D: { x: 1, y: 0 }, L: { x: 0, y: -1 }, R: { x: 0, y: 1 } }[action];
    const newPos = { x: state.robot.x + delta.x, y: state.robot.y + delta.y };
    let newCarried = state.carried;
    let newMask = state.deliveredMask;

    const itemHere = items.find(item => item.start.x === newPos.x && item.start.y === newPos.y);
    const itemIndex = itemHere ? items.indexOf(itemHere) : -1;
    const isUndelivered = itemHere && ((newMask & (1 << itemIndex)) === 0);

    if (state.carried === null && isUndelivered) {
      newCarried = itemHere!.id;
      if (newPos.x === itemHere!.goal.x && newPos.y === itemHere!.goal.y) {
        newMask |= (1 << itemIndex);
        newCarried = null;
      }
    }
    if (newCarried !== null) {
      const carriedItem = items.find(i => i.id === newCarried)!;
      const carriedIdx = items.indexOf(carriedItem);
      if (newPos.x === carriedItem.goal.x && newPos.y === carriedItem.goal.y) {
        newMask |= (1 << carriedIdx);
        newCarried = null;
      }
    }
    state = { robot: newPos, carried: newCarried, deliveredMask: newMask };
  }
  return state;
}

export default function Home() {
  const [gridSize, setGridSize] = useState(4);
  const [obstacles, setObstacles] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<Map<string, Item>>(new Map());
  const [robotPos, setRobotPos] = useState<Point | null>(null);
  const [goals, setGoals] = useState<Map<string, Point>>(new Map());
  const [selectedTool, setSelectedTool] = useState('robot');
  const [solution, setSolution] = useState<Action[] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setObstacles(new Set());
    setItems(new Map());
    setGoals(new Map());
    setRobotPos(null);
    setSolution(null);
    setCurrentStep(0);
    setStatus('');
  }, [gridSize]);

  const handleCellClick = (row: number, col: number) => {
    const key = `${row},${col}`;
    if (selectedTool === 'robot') {
      setRobotPos({ x: row, y: col });
    } else if (selectedTool === 'obstacle') {
      const newObs = new Set(obstacles);
      if (newObs.has(key)) newObs.delete(key);
      else newObs.add(key);
      setObstacles(newObs);
    } else if (selectedTool === 'item') {
      const id = prompt('Nombre del inventario (ej: M1):');
      if (!id) return;
      if (items.has(id)) { alert('Ya existe'); return; }
      const newItem: Item = { id, start: { x: row, y: col }, goal: { x: row, y: col } };
      setItems(new Map(items).set(id, newItem));
      setGoals(new Map(goals).set(id, { x: row, y: col }));
    } else if (selectedTool === 'goal') {
      let itemId: string | null = null;
      for (const [id, item] of items.entries()) {
        if (item.start.x === row && item.start.y === col) { itemId = id; break; }
      }
      if (!itemId) {
        itemId = prompt('ID del inventario para asignar esta meta:');
        if (!itemId || !items.has(itemId)) { alert('Inválido'); return; }
      }
      setGoals(new Map(goals).set(itemId, { x: row, y: col }));
    } else if (selectedTool === 'erase') {
      if (robotPos?.x === row && robotPos?.y === col) setRobotPos(null);
      if (obstacles.has(key)) {
        const newObs = new Set(obstacles); newObs.delete(key); setObstacles(newObs);
      }
      for (const [id, item] of items.entries()) {
        if (item.start.x === row && item.start.y === col) {
          const newItems = new Map(items); newItems.delete(id); setItems(newItems);
          const newGoals = new Map(goals); newGoals.delete(id); setGoals(newGoals);
          break;
        }
      }
    }
    setSolution(null); setCurrentStep(0); setIsPlaying(false);
  };

  const onSolve = () => {
    if (!robotPos) { setStatus('❌ Coloca el robot'); return; }
    if (items.size === 0) { setStatus('❌ Agrega inventarios'); return; }
    const itemsList: Item[] = Array.from(items.values()).map(item => ({
      ...item,
      goal: goals.get(item.id) || item.start,
    }));
    for (const item of itemsList) {
      if (!goals.has(item.id)) { setStatus(`❌ ${item.id} sin meta`); return; }
    }
    const initialState: WarehouseState = { robot: robotPos, carried: null, deliveredMask: 0 };
    const solutionActions = solveAStar(initialState, itemsList, obstacles, gridSize);
    if (solutionActions) {
      setSolution(solutionActions);
      setCurrentStep(0);
      setStatus(`✅ ${solutionActions.length} movimientos`);
      setIsPlaying(false);
    } else {
      setStatus('❌ No se encontró solución');
      setSolution(null);
    }
  };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextStep = () => solution && currentStep < solution.length && setCurrentStep(currentStep+1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep-1);
  const resetSimulation = () => setCurrentStep(0);
  const playSolution = () => {
    if (!solution) return;
    setIsPlaying(true);
    let step = currentStep;
    intervalRef.current = setInterval(() => {
      if (step < solution.length) { step++; setCurrentStep(step); }
      else { clearInterval(intervalRef.current!); intervalRef.current = null; setIsPlaying(false); }
    }, 600);
  };
  const pauseSolution = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPlaying(false);
    }
  };

  // Construir lista de estados históricos (desde paso 0 hasta currentStep)
  let historyStates: WarehouseState[] = [];
  if (robotPos && solution && items.size > 0) {
    const itemsList = Array.from(items.values()).map(item => ({
      ...item,
      goal: goals.get(item.id) || item.start,
    }));
    const initState: WarehouseState = { robot: robotPos, carried: null, deliveredMask: 0 };
    for (let step = 0; step <= currentStep; step++) {
      const state = getStateAtStep(initState, solution, step, itemsList);
      historyStates.push(state);
    }
  }

  const itemsListForGrid = Array.from(items.values()).map(item => ({
    ...item,
    goal: goals.get(item.id) || item.start,
  }));
  const currentState = historyStates.length > 0 ? historyStates[historyStates.length-1] : null;

  return (
    <>
      <main className="flex flex-row p-4 gap-4 min-h-screen bg-gray-100">      
        {/* Historial izquierdo */}
        <StateHistory states={historyStates} items={itemsListForGrid} />

        {/* Columna derecha: controles + tablero */}
        <div className="flex-1 flex flex-col">
          <ControlPanel
            gridSize={gridSize} setGridSize={setGridSize}
            selectedTool={selectedTool} setSelectedTool={setSelectedTool}
            onSolve={onSolve} status={status}
            solution={solution} currentStep={currentStep}
            onNext={nextStep} onPrev={prevStep} onPlay={playSolution}
            onPause={pauseSolution} onReset={resetSimulation} isPlaying={isPlaying}
          />
          <Grid
            size={gridSize}
            currentState={currentState}
            items={itemsListForGrid}
            obstacles={obstacles}
            onCellClick={handleCellClick}
          />
        </div>
      </main>
    </>
  );
}
