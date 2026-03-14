/**
 * 囲碁のルール・ロジック + 飛刀囲碁拡張
 * ゲームUIから独立した純粋なゲームロジック
 */

import type { BoardState, Vertex, Stone, PlayerColor, LockedStones } from './types';

/**
 * 空の盤面を作成
 */
export function createEmptyBoard(size: number): BoardState {
  return Array.from({ length: size }, () => Array(size).fill(0) as Stone[]);
}

/**
 * ロック状態の盤面を作成（全てfalse）
 */
export function createEmptyLockMap(size: number): LockedStones {
  return Array.from({ length: size }, () => Array(size).fill(false));
}

/**
 * 盤面をコピー
 */
export function copyBoard(board: BoardState): BoardState {
  return board.map(row => [...row]);
}

/**
 * ロックマップをコピー
 */
export function copyLockMap(lockMap: LockedStones): LockedStones {
  return lockMap.map(row => [...row]);
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
  const tempBoard = setStone(board, vertex, player);
  const captures = findCaptures(tempBoard, vertex, player);
  if (captures.length > 0) {
    return false;
  }
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
  koVertex: Vertex | null,
  lockedStones?: LockedStones
): { valid: boolean; reason?: string } {
  const boardSize = board.length;

  if (!isValidVertex(vertex, boardSize)) {
    return { valid: false, reason: '盤面外です' };
  }

  if (getStone(board, vertex) !== 0) {
    return { valid: false, reason: 'すでに石があります' };
  }

  // ロックされた場所には打てない（周囲がロック済みの場合）
  if (lockedStones) {
    const [x, y] = vertex;
    if (lockedStones[y][x]) {
      return { valid: false, reason: 'ロックされた陣地です' };
    }
  }

  if (koVertex && vertex[0] === koVertex[0] && vertex[1] === koVertex[1]) {
    return { valid: false, reason: 'コウのため打てません' };
  }

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
  player: PlayerColor,
  lockedStones?: LockedStones
): { board: BoardState; captured: Vertex[] } {
  let newBoard = setStone(board, vertex, player);

  // 相手の石を取る（ロックされた石は取れない）
  let captured = findCaptures(newBoard, vertex, player);
  if (lockedStones) {
    captured = captured.filter(([cx, cy]) => !lockedStones[cy][cx]);
  }
  if (captured.length > 0) {
    newBoard = removeStones(newBoard, captured);
  }

  return { board: newBoard, captured };
}

/**
 * コウかどうかを判定
 */
export function detectKo(
  captured: Vertex[],
  vertex: Vertex,
  board: BoardState
): Vertex | null {
  if (captured.length !== 1) {
    return null;
  }
  const group = getGroup(board, vertex);
  if (group.length === 1 && countLiberties(board, group) === 1) {
    return captured[0];
  }
  return null;
}

// === 飛刀囲碁 拡張ルール ===

/**
 * 鎌刀（ひっくり返し）: 指定した石とその上下左右の相手の石をひっくり返す
 * ロックされた石はひっくり返せない
 */
export function executeStoneFlip(
  board: BoardState,
  vertex: Vertex,
  player: PlayerColor,
  lockedStones: LockedStones
): { board: BoardState; flippedStones: Vertex[] } {
  const boardSize = board.length;
  const [x, y] = vertex;
  const opponent = -player as PlayerColor;
  const flipped: Vertex[] = [];
  let newBoard = copyBoard(board);

  // 指定した座標とその上下左右をチェック
  const targets: Vertex[] = [
    [x, y],
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const target of targets) {
    if (!isValidVertex(target, boardSize)) continue;
    const [tx, ty] = target;
    if (lockedStones[ty][tx]) continue; // ロック済みはスキップ
    if (getStone(newBoard, target) === opponent) {
      newBoard[ty][tx] = player;
      flipped.push(target);
    }
  }

  return { board: newBoard, flippedStones: flipped };
}

/**
 * 陣地のロック判定
 * 死活が確定している領域の石をロックする（簡易判定）
 * - 完全に囲まれたグループ（2眼以上）はロック対象
 */
export function evaluateLockedTerritory(
  board: BoardState,
  currentLocks: LockedStones
): LockedStones {
  const size = board.length;
  const newLocks = copyLockMap(currentLocks);
  const visited = new Set<string>();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stone = board[y][x];
      if (stone === 0) continue;

      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      const group = getGroup(board, [x, y]);
      for (const [gx, gy] of group) {
        visited.add(`${gx},${gy}`);
      }

      const liberties = countLiberties(board, group);
      // 2眼以上あるグループで、サイズが3以上の場合はロック
      if (liberties >= 2 && group.length >= 3 && hasTwoEyes(board, group)) {
        for (const [gx, gy] of group) {
          newLocks[gy][gx] = true;
        }
      }
    }
  }

  return newLocks;
}

/**
 * 簡易2眼判定
 * グループに隣接する空点のうち、互いに離れた空点が2つ以上あるか
 */
export function hasTwoEyes(board: BoardState, group: Vertex[]): boolean {
  const boardSize = board.length;
  const emptyNeighbors: Vertex[] = [];
  const seen = new Set<string>();

  for (const vertex of group) {
    for (const neighbor of getNeighbors(vertex, boardSize)) {
      const key = `${neighbor[0]},${neighbor[1]}`;
      if (!seen.has(key) && getStone(board, neighbor) === 0) {
        seen.add(key);
        emptyNeighbors.push(neighbor);
      }
    }
  }

  if (emptyNeighbors.length < 2) return false;

  // 空点をグループに分ける（隣接する空点は同じ目）
  const eyeVisited = new Set<string>();
  let eyeCount = 0;

  for (const empty of emptyNeighbors) {
    const eKey = `${empty[0]},${empty[1]}`;
    if (eyeVisited.has(eKey)) continue;

    // この空点から連続する空点を探索（ただしグループに隣接するもののみ）
    const eyeStack: Vertex[] = [empty];
    eyeVisited.add(eKey);

    while (eyeStack.length > 0) {
      const current = eyeStack.pop()!;
      for (const neighbor of getNeighbors(current, boardSize)) {
        const nKey = `${neighbor[0]},${neighbor[1]}`;
        if (!eyeVisited.has(nKey) && seen.has(nKey)) {
          eyeVisited.add(nKey);
          eyeStack.push(neighbor);
        }
      }
    }

    eyeCount++;
    if (eyeCount >= 2) return true;
  }

  return false;
}

/**
 * 簡易地計算（中国ルール準拠）
 * 各プレイヤーの石の数 + 囲んだ空点の数
 */
export function calculateScore(board: BoardState): { black: number; white: number } {
  const size = board.length;
  let blackScore = 0;
  let whiteScore = 0;
  const visited = new Set<string>();

  // 石を数える
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === 1) blackScore++;
      else if (board[y][x] === -1) whiteScore++;
    }
  }

  // 囲まれた空点を数える
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== 0) continue;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      // 空点のグループを探索
      const emptyGroup: Vertex[] = [];
      const stack: Vertex[] = [[x, y]];
      let touchesBlack = false;
      let touchesWhite = false;
      visited.add(key);

      while (stack.length > 0) {
        const current = stack.pop()!;
        emptyGroup.push(current);

        for (const neighbor of getNeighbors(current, size)) {
          const nKey = `${neighbor[0]},${neighbor[1]}`;
          const stone = getStone(board, neighbor);
          if (stone === 1) touchesBlack = true;
          else if (stone === -1) touchesWhite = true;
          else if (!visited.has(nKey)) {
            visited.add(nKey);
            stack.push(neighbor);
          }
        }
      }

      // 一色のみに接する空点は陣地
      if (touchesBlack && !touchesWhite) {
        blackScore += emptyGroup.length;
      } else if (touchesWhite && !touchesBlack) {
        whiteScore += emptyGroup.length;
      }
    }
  }

  return { black: blackScore, white: whiteScore };
}
