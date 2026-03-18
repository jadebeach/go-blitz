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

// --- ヘルパー: 座標キー ---
function vKey(v: Vertex): string {
  return `${v[0]},${v[1]}`;
}

/**
 * グループの隣接空点を「目候補」の領域ごとに分割して返す
 * 各領域は連結した空点の集合（グループの内部空間）
 */
function getEyeRegions(board: BoardState, group: Vertex[]): Vertex[][] {
  const boardSize = board.length;
  const groupSet = new Set(group.map(vKey));

  // グループに隣接する空点を集める
  const emptyNeighborSet = new Set<string>();
  const emptyNeighbors: Vertex[] = [];
  for (const v of group) {
    for (const nb of getNeighbors(v, boardSize)) {
      const k = vKey(nb);
      if (!emptyNeighborSet.has(k) && getStone(board, nb) === 0) {
        emptyNeighborSet.add(k);
        emptyNeighbors.push(nb);
      }
    }
  }

  // 空点を連結成分に分ける（BFS）
  // ただし探索は「空点かつグループに隣接する空点の連結」に限定
  // → グループに囲まれた内部空間のみを目候補とする
  const visited = new Set<string>();
  const regions: Vertex[][] = [];

  for (const start of emptyNeighbors) {
    const sk = vKey(start);
    if (visited.has(sk)) continue;

    const region: Vertex[] = [];
    const queue: Vertex[] = [start];
    visited.add(sk);

    while (queue.length > 0) {
      const cur = queue.pop()!;
      region.push(cur);

      for (const nb of getNeighbors(cur, boardSize)) {
        const nk = vKey(nb);
        if (visited.has(nk)) continue;
        const stone = getStone(board, nb);
        if (stone === 0) {
          visited.add(nk);
          queue.push(nb);
        }
      }
    }

    regions.push(region);
  }

  return regions;
}

/**
 * 目領域が「真の目」かどうかを判定
 *
 * 真の目の条件:
 * 1. 領域内の全ての空点の隣接石が、全てこのグループの色である
 *    （相手の石が1つでも隣接していたら偽の目の可能性）
 * 2. サイズ1の目の場合: 対角線上の相手石が「多すぎない」こと
 *    - 辺/隅: 対角に相手石が1つでもあれば偽の目
 *    - 中央: 対角に相手石が2つ以上あれば偽の目
 * 3. サイズ2以上の目は、全点が同色のみに囲まれていれば真の目
 */
function isTrueEye(
  board: BoardState,
  region: Vertex[],
  player: PlayerColor
): boolean {
  const boardSize = board.length;
  const opponent = -player as PlayerColor;

  // 領域の全点が、相手石と隣接していないことを確認
  const regionSet = new Set(region.map(vKey));
  for (const v of region) {
    for (const nb of getNeighbors(v, boardSize)) {
      const k = vKey(nb);
      if (regionSet.has(k)) continue; // 同じ目領域内はスキップ
      const stone = getStone(board, nb);
      if (stone === opponent) return false; // 相手石が隣接 → 偽の目
      // stone === 0 で領域外 → グループに完全に囲まれていない可能性
      // ただし、他の目領域かもしれないのでここでは厳密にチェックしない
    }
  }

  // サイズ1の目: 対角チェック
  if (region.length === 1) {
    const [x, y] = region[0];
    const diagonals: Vertex[] = [
      [x - 1, y - 1], [x + 1, y - 1],
      [x - 1, y + 1], [x + 1, y + 1],
    ];

    const validDiags = diagonals.filter(d => isValidVertex(d, boardSize));
    const opponentDiags = validDiags.filter(d => getStone(board, d) === opponent);

    // 辺/隅（対角が4つ未満）: 1つでも相手石があれば偽
    // 中央（対角が4つ）: 2つ以上相手石があれば偽
    if (validDiags.length < 4) {
      if (opponentDiags.length >= 1) return false;
    } else {
      if (opponentDiags.length >= 2) return false;
    }
  }

  // サイズ2+: 領域の全空点が同色のグループのみに隣接していれば OK
  // （上のループで opponent 隣接チェック済み）
  // 追加: 領域外の空点に繋がっていないか（開放されていないか）
  for (const v of region) {
    for (const nb of getNeighbors(v, boardSize)) {
      const k = vKey(nb);
      if (regionSet.has(k)) continue;
      const stone = getStone(board, nb);
      if (stone === 0) {
        // 領域外の空点に繋がっている → 閉じていない目
        return false;
      }
    }
  }

  return true;
}

/**
 * Benson のアルゴリズムに基づく無条件生き判定
 *
 * グループが「無条件に生きている」= 相手がどんな手順で打っても取れない
 * 条件: グループが2つ以上の vital region を持つ
 *
 * vital region: 空点領域で、その全ての空点が:
 *   - グループの石にのみ隣接（相手石や外部の空点に繋がらない）
 *
 * Benson の厳密な反復除去:
 * 1. 全グループと全 vital region をリストアップ
 * 2. vital region が2未満のグループを除去
 * 3. 除去されたグループの石が隣接する region を除去
 * 4. 変化がなくなるまで繰り返す
 * 5. 残ったグループが無条件生き
 */
export function findUnconditionallyAlive(
  board: BoardState,
  player: PlayerColor
): Set<string> {
  const boardSize = board.length;

  // 1. player の全グループを列挙
  const visitedStones = new Set<string>();
  const allGroups: Vertex[][] = [];
  const groupIdMap = new Map<string, number>(); // vertex key → group index

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== player) continue;
      const k = vKey([x, y]);
      if (visitedStones.has(k)) continue;

      const group = getGroup(board, [x, y]);
      const gIdx = allGroups.length;
      allGroups.push(group);
      for (const gv of group) {
        const gk = vKey(gv);
        visitedStones.add(gk);
        groupIdMap.set(gk, gIdx);
      }
    }
  }

  if (allGroups.length === 0) return new Set();

  // 2. 全閉じた空点領域を列挙
  //    「閉じた」= 領域の全空点が player の石のみに隣接する
  const visitedEmpty = new Set<string>();
  const allRegions: Vertex[][] = [];
  // regionToGroups[i] = region i に隣接するグループのインデックス集合
  const regionToGroups: Set<number>[] = [];
  // groupToRegions[i] = group i に隣接する region のインデックス集合
  const groupToRegions: Set<number>[] = allGroups.map(() => new Set());

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue;
      const k = vKey([x, y]);
      if (visitedEmpty.has(k)) continue;

      // BFS で空点領域を探索
      const region: Vertex[] = [];
      const queue: Vertex[] = [[x, y]];
      visitedEmpty.add(k);
      const adjGroupIds = new Set<number>();
      let isVital = true;

      while (queue.length > 0) {
        const cur = queue.pop()!;
        region.push(cur);

        for (const nb of getNeighbors(cur, boardSize)) {
          const nk = vKey(nb);
          const stone = getStone(board, nb);
          if (stone === 0) {
            if (!visitedEmpty.has(nk)) {
              visitedEmpty.add(nk);
              queue.push(nb);
            }
          } else if (stone === player) {
            const gId = groupIdMap.get(nk);
            if (gId !== undefined) adjGroupIds.add(gId);
          } else {
            // 相手石に隣接 → vital ではない
            isVital = false;
          }
        }
      }

      if (!isVital) continue;

      const rIdx = allRegions.length;
      allRegions.push(region);
      regionToGroups.push(adjGroupIds);
      for (const gId of adjGroupIds) {
        groupToRegions[gId].add(rIdx);
      }
    }
  }

  // 3. Benson の反復除去
  const aliveGroups = new Set(allGroups.map((_, i) => i));
  const aliveRegions = new Set(allRegions.map((_, i) => i));

  let changed = true;
  while (changed) {
    changed = false;

    // vital region が2未満のグループを除去
    for (const gId of aliveGroups) {
      let vitalCount = 0;
      for (const rId of groupToRegions[gId]) {
        if (aliveRegions.has(rId)) vitalCount++;
      }
      if (vitalCount < 2) {
        aliveGroups.delete(gId);
        changed = true;
      }
    }

    // 除去されたグループに隣接する region を除去
    for (const rId of aliveRegions) {
      for (const gId of regionToGroups[rId]) {
        if (!aliveGroups.has(gId)) {
          aliveRegions.delete(rId);
          changed = true;
          break;
        }
      }
    }
  }

  // 4. 残ったグループの石を返す
  const result = new Set<string>();
  for (const gId of aliveGroups) {
    for (const v of allGroups[gId]) {
      result.add(vKey(v));
    }
  }

  return result;
}

/**
 * 陣地のロック判定（改良版）
 *
 * 3段階で判定:
 * 1. Benson の無条件生き判定（最も信頼性が高い）
 * 2. 真の目を2つ以上持つグループ（対角チェック含む）
 * 3. 十分な大きさの内部空間を持つグループ
 *
 * ロック対象: 上記いずれかを満たすグループの石
 */
export function evaluateLockedTerritory(
  board: BoardState,
  currentLocks: LockedStones
): LockedStones {
  const size = board.length;
  const newLocks = copyLockMap(currentLocks);

  // Benson: 黒・白それぞれ無条件生きの石を検出
  const blackAlive = findUnconditionallyAlive(board, 1);
  const whiteAlive = findUnconditionallyAlive(board, -1);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = vKey([x, y]);
      if (blackAlive.has(k) || whiteAlive.has(k)) {
        newLocks[y][x] = true;
      }
    }
  }

  // 追加: Benson で見つからなかったが、2真眼を持つグループもロック
  const visited = new Set<string>();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const stone = board[y][x];
      if (stone === 0) continue;
      const k = vKey([x, y]);
      if (visited.has(k)) continue;
      if (newLocks[y][x]) { // すでに Benson でロック済み
        const group = getGroup(board, [x, y]);
        for (const gv of group) visited.add(vKey(gv));
        continue;
      }

      const group = getGroup(board, [x, y]);
      for (const gv of group) visited.add(vKey(gv));

      // 小さすぎるグループはスキップ
      if (group.length < 3) continue;

      // 目領域を取得し、真の目を数える
      const regions = getEyeRegions(board, group);
      let trueEyeCount = 0;
      for (const region of regions) {
        if (isTrueEye(board, region, stone as PlayerColor)) {
          trueEyeCount++;
        }
      }

      if (trueEyeCount >= 2) {
        for (const [gx, gy] of group) {
          newLocks[gy][gx] = true;
        }
      }
    }
  }

  return newLocks;
}

/**
 * 後方互換: hasTwoEyes — 真の2眼判定（改良版）
 */
export function hasTwoEyes(board: BoardState, group: Vertex[]): boolean {
  if (group.length === 0) return false;
  const player = getStone(board, group[0]) as PlayerColor;
  if (player === 0) return false;

  const regions = getEyeRegions(board, group);
  let trueEyeCount = 0;
  for (const region of regions) {
    if (isTrueEye(board, region, player)) {
      trueEyeCount++;
      if (trueEyeCount >= 2) return true;
    }
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
