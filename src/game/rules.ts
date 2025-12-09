/**
 * 囲碁のルール・ロジック
 * ゲームUIから独立した純粋なゲームロジック
 */

import type { BoardState, Vertex, Stone, PlayerColor } from './types';

/**
 * 空の盤面を作成
 */
export function createEmptyBoard(size: number): BoardState {
  return Array.from({ length: size }, () => Array(size).fill(0) as Stone[]);
}

/**
 * 盤面をコピー
 */
export function copyBoard(board: BoardState): BoardState {
  return board.map(row => [...row]);
}

/**
 * 座標が盤面内かどうか
 */
export function isValidVertex(vertex: Vertex, boardSize: number): boolean {
  const [x, y] = vertex;
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

/**
 * 指定座標の石を取得
 */
export function getStone(board: BoardState, vertex: Vertex): Stone {
  const [x, y] = vertex;
  return board[y]?.[x] ?? 0;
}

/**
 * 指定座標に石を配置（新しい盤面を返す）
 */
export function setStone(board: BoardState, vertex: Vertex, stone: Stone): BoardState {
  const newBoard = copyBoard(board);
  const [x, y] = vertex;
  newBoard[y][x] = stone;
  return newBoard;
}

/**
 * 隣接する座標を取得
 */
export function getNeighbors(vertex: Vertex, boardSize: number): Vertex[] {
  const [x, y] = vertex;
  const neighbors: Vertex[] = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  return neighbors.filter(v => isValidVertex(v, boardSize));
}

/**
 * 石のグループ（連）を取得
 */
export function getGroup(board: BoardState, vertex: Vertex): Vertex[] {
  const stone = getStone(board, vertex);
  if (stone === 0) return [];

  const boardSize = board.length;
  const visited = new Set<string>();
  const group: Vertex[] = [];
  const stack: Vertex[] = [vertex];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current[0]},${current[1]}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (getStone(board, current) === stone) {
      group.push(current);
      const neighbors = getNeighbors(current, boardSize);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor[0]},${neighbor[1]}`;
        if (!visited.has(neighborKey)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return group;
}

/**
 * グループの呼吸点（ダメ）を数える
 */
export function countLiberties(board: BoardState, group: Vertex[]): number {
  const boardSize = board.length;
  const liberties = new Set<string>();

  for (const vertex of group) {
    const neighbors = getNeighbors(vertex, boardSize);
    for (const neighbor of neighbors) {
      if (getStone(board, neighbor) === 0) {
        liberties.add(`${neighbor[0]},${neighbor[1]}`);
      }
    }
  }

  return liberties.size;
}

/**
 * 着手後に取れる石を見つける
 */
export function findCaptures(
  board: BoardState,
  placedVertex: Vertex,
  player: PlayerColor
): Vertex[] {
  const boardSize = board.length;
  const opponent = -player as PlayerColor;
  const captured: Vertex[] = [];
  const checkedGroups = new Set<string>();

  const neighbors = getNeighbors(placedVertex, boardSize);

  for (const neighbor of neighbors) {
    if (getStone(board, neighbor) === opponent) {
      const group = getGroup(board, neighbor);
      const groupKey = group.map(v => `${v[0]},${v[1]}`).sort().join('|');

      if (!checkedGroups.has(groupKey)) {
        checkedGroups.add(groupKey);
        if (countLiberties(board, group) === 0) {
          captured.push(...group);
        }
      }
    }
  }

  return captured;
}

/**
 * 石を盤面から取り除く
 */
export function removeStones(board: BoardState, stones: Vertex[]): BoardState {
  let newBoard = copyBoard(board);
  for (const vertex of stones) {
    newBoard = setStone(newBoard, vertex, 0);
  }
  return newBoard;
}

/**
 * 着手が自殺手かどうか
 */
export function isSuicide(
  board: BoardState,
  vertex: Vertex,
  player: PlayerColor
): boolean {
  // 一時的に石を置く
  const tempBoard = setStone(board, vertex, player);

  // 相手の石を取れるか確認
  const captures = findCaptures(tempBoard, vertex, player);
  if (captures.length > 0) {
    return false; // 相手を取れるので自殺ではない
  }

  // 自分のグループの呼吸点を確認
  const group = getGroup(tempBoard, vertex);
  return countLiberties(tempBoard, group) === 0;
}

/**
 * 着手が有効かどうか確認
 */
export function isValidMove(
  board: BoardState,
  vertex: Vertex,
  player: PlayerColor,
  koVertex: Vertex | null
): { valid: boolean; reason?: string } {
  const boardSize = board.length;

  // 盤面外
  if (!isValidVertex(vertex, boardSize)) {
    return { valid: false, reason: '盤面外です' };
  }

  // すでに石がある
  if (getStone(board, vertex) !== 0) {
    return { valid: false, reason: 'すでに石があります' };
  }

  // コウ
  if (koVertex && vertex[0] === koVertex[0] && vertex[1] === koVertex[1]) {
    return { valid: false, reason: 'コウのため打てません' };
  }

  // 自殺手
  if (isSuicide(board, vertex, player)) {
    return { valid: false, reason: '自殺手は打てません' };
  }

  return { valid: true };
}

/**
 * 着手を実行し、新しい盤面と取られた石を返す
 */
export function executeMove(
  board: BoardState,
  vertex: Vertex,
  player: PlayerColor
): { board: BoardState; captured: Vertex[] } {
  // 石を置く
  let newBoard = setStone(board, vertex, player);

  // 相手の石を取る
  const captured = findCaptures(newBoard, vertex, player);
  if (captured.length > 0) {
    newBoard = removeStones(newBoard, captured);
  }

  return { board: newBoard, captured };
}

/**
 * コウかどうかを判定（1つの石を取り返せる状況）
 */
export function detectKo(
  captured: Vertex[],
  vertex: Vertex,
  board: BoardState
): Vertex | null {
  // 1つだけ取った場合のみコウの可能性
  if (captured.length !== 1) {
    return null;
  }

  // 置いた石のグループが1つで、呼吸点が1つの場合
  const group = getGroup(board, vertex);
  if (group.length === 1 && countLiberties(board, group) === 1) {
    return captured[0];
  }

  return null;
}
