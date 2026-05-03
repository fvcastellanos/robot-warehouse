export type Point = { x: number; y: number };
export type Action = 'U' | 'D' | 'L' | 'R';

export interface Item {
  id: string;
  start: Point;
  goal: Point;
}

export interface WarehouseState {
  robot: Point;
  carried: string | null;
  deliveredMask: number; // bits: cada bit indica si el item i fue entregado
}

interface Node {
  state: WarehouseState;
  g: number;
  f: number;
  parent: Node | null;
  action: Action | null;
}

function manhattan(p1: Point, p2: Point): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function heuristic(state: WarehouseState, items: Item[]): number {
  let h = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if ((state.deliveredMask & (1 << i)) !== 0) continue;
    const currentPos = (state.carried === item.id) ? state.robot : item.start;
    h += manhattan(currentPos, item.goal);
  }
  return h;
}

function getSuccessors(
  state: WarehouseState,
  items: Item[],
  obstacles: Set<string>,
  gridSize: number
): { state: WarehouseState; action: Action }[] {
  const dirs: { dx: number; dy: number; action: Action }[] = [
    { dx: -1, dy: 0, action: 'U' },
    { dx: 1, dy: 0, action: 'D' },
    { dx: 0, dy: -1, action: 'L' },
    { dx: 0, dy: 1, action: 'R' },
  ];
  const result = [];
  const itemMap = new Map<string, Item>();
  for (const item of items) {
    itemMap.set(`${item.start.x},${item.start.y}`, item);
  }

  for (const dir of dirs) {
    const nx = state.robot.x + dir.dx;
    const ny = state.robot.y + dir.dy;
    if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
    if (obstacles.has(`${nx},${ny}`)) continue;

    const newPos: Point = { x: nx, y: ny };
    const itemHere = itemMap.get(`${nx},${ny}`);
    const itemIndex = itemHere ? items.indexOf(itemHere) : -1;
    const isUndelivered = itemHere && ((state.deliveredMask & (1 << itemIndex)) === 0);

    // No puede entrar a celda con otro inventario si ya lleva uno
    if (state.carried !== null && isUndelivered && state.carried !== itemHere!.id) continue;

    let newCarried = state.carried;
    let newMask = state.deliveredMask;

    // Recoger
    if (state.carried === null && isUndelivered) {
      newCarried = itemHere!.id;
      // Si al recoger ya está en su goal, entregar inmediatamente
      if (nx === itemHere!.goal.x && ny === itemHere!.goal.y) {
        newMask |= (1 << itemIndex);
        newCarried = null;
      }
    }

    // Entregar si lleva uno y está en su goal
    if (newCarried !== null) {
      const carriedItem = items.find(i => i.id === newCarried)!;
      const carriedIdx = items.indexOf(carriedItem);
      if (nx === carriedItem.goal.x && ny === carriedItem.goal.y) {
        newMask |= (1 << carriedIdx);
        newCarried = null;
      }
    }

    result.push({
      state: { robot: newPos, carried: newCarried, deliveredMask: newMask },
      action: dir.action,
    });
  }
  return result;
}

function stateToKey(state: WarehouseState): string {
  return `${state.robot.x},${state.robot.y}|${state.carried ?? 'null'}|${state.deliveredMask}`;
}

export function solveAStar(
  initialState: WarehouseState,
  items: Item[],
  obstacles: Set<string>,
  gridSize: number
): Action[] | null {
  const openSet: Node[] = [];
  const bestG = new Map<string, number>();

  const startNode: Node = {
    state: initialState,
    g: 0,
    f: heuristic(initialState, items),
    parent: null,
    action: null,
  };
  openSet.push(startNode);
  bestG.set(stateToKey(initialState), 0);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    const allDelivered = current.state.deliveredMask === (1 << items.length) - 1;
    if (allDelivered) {
      const path: Action[] = [];
      let node: Node | null = current;
      while (node?.parent) {
        path.unshift(node.action!);
        node = node.parent;
      }
      return path;
    }

    const successors = getSuccessors(current.state, items, obstacles, gridSize);
    for (const succ of successors) {
      const newG = current.g + 1;
      const key = stateToKey(succ.state);
      if (!bestG.has(key) || newG < bestG.get(key)!) {
        bestG.set(key, newG);
        const newNode: Node = {
          state: succ.state,
          g: newG,
          f: newG + heuristic(succ.state, items),
          parent: current,
          action: succ.action,
        };
        openSet.push(newNode);
      }
    }
  }
  return null;
}
