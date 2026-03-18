/**
 * Go Blitz - 飛刀囲碁 ゲーム状態管理
 * ゲームの状態遷移を管理する純粋関数
 */

import type {
  GameState,
  GameConfig,
  Vertex,
  PlayerColor,
  Move,
  MoveResult,
  SpecialMoveType,
  GamePhase,
  GameResult,
  ComboState,
} from './types';
import { SPECIAL_MOVE_COSTS, GAUGE_CONFIG } from './types';
import {
  createEmptyBoard,
  createEmptyLockMap,
  isValidMove,
  executeMove,
  detectKo,
  evaluateLockedTerritory,
  calculateScore,
} from './rules';

/**
 * 初期ゲーム状態を作成（11路盤固定）
 */
export function createInitialState(_config?: GameConfig): GameState {
  const boardSize = 11;

  return {
    boardSize,
    board: createEmptyBoard(boardSize),
    currentPlayer: 1,
    moveHistory: [],
    captures: { black: 0, white: 0 },
    consecutivePasses: 0,
    isGameOver: false,
    koVertex: null,
    superGauge: { black: 0, white: 0 },
    lockedStones: createEmptyLockMap(boardSize),
    moveCount: 0,
    gamePhase: 'opening',
    gameResult: null,
    comboState: null,
    doubleMoveCooldown: { black: null, white: null },
    systemMessages: ['ゲーム開始！11路盤 飛刀囲碁モード'],
  };
}

function switchPlayer(player: PlayerColor): PlayerColor {
  return player === 1 ? -1 : 1;
}

function determinePhase(moveCount: number): GamePhase {
  if (moveCount < 20) return 'opening';
  if (moveCount < 60) return 'midgame';
  return 'endgame';
}

/**
 * ゲージを加算（キャップ付き）
 */
function addGauge(current: number, amount: number): number {
  return Math.min(current + amount, GAUGE_CONFIG.maxGauge);
}

/**
 * 現在のプレイヤーのゲージを取得
 */
export function getPlayerGauge(state: GameState, player?: PlayerColor): number {
  const p = player ?? state.currentPlayer;
  return p === 1 ? state.superGauge.black : state.superGauge.white;
}

/**
 * 双炮のクールダウン残り手数を返す（0=使用可能）
 */
export function getDoubleMoveCooldownRemaining(state: GameState, player?: PlayerColor): number {
  const p = player ?? state.currentPlayer;
  const lastUsed = p === 1 ? state.doubleMoveCooldown.black : state.doubleMoveCooldown.white;
  if (lastUsed === null) return 0;
  const elapsed = state.moveCount - lastUsed;
  const remaining = GAUGE_CONFIG.doubleMoveCooldown - elapsed;
  return Math.max(0, remaining);
}

/**
 * 必殺技が使用可能かチェック
 */
export function canUseSpecialMove(
  state: GameState,
  type: SpecialMoveType,
  player?: PlayerColor
): boolean {
  if (state.isGameOver) return false;
  if (state.comboState) return false; // コンボ中は発動不可
  const gauge = getPlayerGauge(state, player);
  if (gauge < SPECIAL_MOVE_COSTS[type]) return false;

  // 双炮のクールダウンチェック
  if (type === 'doubleMove') {
    if (getDoubleMoveCooldownRemaining(state, player) > 0) return false;
  }

  return true;
}

/**
 * 陣地ロック判定が必要かチェック (51, 81, 111...)
 */
function shouldEvaluateLocks(moveCount: number): boolean {
  if (moveCount < GAUGE_CONFIG.lockMoveThreshold) return false;
  if (moveCount === GAUGE_CONFIG.lockMoveThreshold) return true;
  return (moveCount - GAUGE_CONFIG.lockMoveThreshold) % GAUGE_CONFIG.lockInterval === 0;
}

/**
 * ゲージを更新するヘルパー（プレイヤー指定）
 */
function updateGauge(
  gauge: { black: number; white: number },
  player: PlayerColor,
  amount: number
): { black: number; white: number } {
  const newGauge = { ...gauge };
  if (player === 1) {
    newGauge.black = addGauge(newGauge.black, amount);
  } else {
    newGauge.white = addGauge(newGauge.white, amount);
  }
  return newGauge;
}

/**
 * ゲージを消費するヘルパー
 */
function consumeGauge(
  gauge: { black: number; white: number },
  player: PlayerColor,
  amount: number
): { black: number; white: number } {
  const newGauge = { ...gauge };
  if (player === 1) {
    newGauge.black = Math.max(0, newGauge.black - amount);
  } else {
    newGauge.white = Math.max(0, newGauge.white - amount);
  }
  return newGauge;
}

/**
 * 通常の石を置く
 */
export function placeStone(state: GameState, vertex: Vertex): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  // 着手の有効性をチェック
  const validation = isValidMove(
    state.board,
    vertex,
    state.currentPlayer,
    state.koVertex,
    state.lockedStones
  );

  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // 着手を実行
  const { board: newBoard, captured } = executeMove(
    state.board, vertex, state.currentPlayer, state.lockedStones
  );

  const koVertex = detectKo(captured, vertex, newBoard);
  const newMoveCount = state.moveCount + 1;
  const messages: string[] = [];

  // 取った石をカウント
  const newCaptures = { ...state.captures };
  if (state.currentPlayer === 1) {
    newCaptures.black += captured.length;
  } else {
    newCaptures.white += captured.length;
  }

  // --- コンボ中の処理 ---
  if (state.comboState) {
    const combo = state.comboState;
    const newMovesPlayed = combo.movesPlayed + 1;
    const newVertices = [...combo.vertices, vertex];

    // ゲージ: 手ボーナス + アゲハマボーナス
    let newGauge = updateGauge(state.superGauge, state.currentPlayer, GAUGE_CONFIG.gainPerMove);
    if (captured.length > 0) {
      newGauge = updateGauge(newGauge, state.currentPlayer, captured.length * GAUGE_CONFIG.gainPerCapture);
    }

    // コンボ完了?
    if (newMovesPlayed >= combo.movesTotal) {
      // コンボ完了 → 着手記録してプレイヤー交代
      const moveName = combo.type === 'doubleMove' ? '双炮' : '三閃';
      messages.push(`${getCurrentPlayerName(state.currentPlayer)}の${moveName}完了！`);

      // Move記録を更新
      const lastMove = state.moveHistory[state.moveHistory.length - 1];
      const updatedMove: Move = { ...lastMove };
      if (combo.type === 'doubleMove') {
        updatedMove.secondVertex = vertex;
      } else {
        // tripleMove: 2手目か3手目
        if (newMovesPlayed === 2) {
          updatedMove.secondVertex = vertex;
        }
        if (newMovesPlayed === 3) {
          updatedMove.thirdVertex = vertex;
        }
        // 2手目がすでにあるなら3手目
        if (updatedMove.secondVertex && newMovesPlayed === 3) {
          updatedMove.thirdVertex = vertex;
        } else if (!updatedMove.secondVertex) {
          updatedMove.secondVertex = vertex;
        }
      }
      const newHistory = [...state.moveHistory.slice(0, -1), updatedMove];

      // ロック判定
      let newLocks = state.lockedStones;
      if (shouldEvaluateLocks(newMoveCount)) {
        newLocks = evaluateLockedTerritory(newBoard, state.lockedStones);
        messages.push(`${newMoveCount}手目: 陣地ロック判定実行`);
      }

      return {
        success: true,
        newState: {
          ...state,
          board: newBoard,
          currentPlayer: switchPlayer(state.currentPlayer),
          moveHistory: newHistory,
          captures: newCaptures,
          consecutivePasses: 0,
          koVertex,
          superGauge: newGauge,
          lockedStones: newLocks,
          moveCount: newMoveCount,
          gamePhase: determinePhase(newMoveCount),
          comboState: null,
          systemMessages: [...state.systemMessages, ...messages],
        },
        capturedStones: captured,
      };
    }

    // コンボ継続中
    const remaining = combo.movesTotal - newMovesPlayed;
    const moveName = combo.type === 'doubleMove' ? '双炮' : '三閃';
    messages.push(`${moveName}: 残り${remaining}手`);

    // Move記録更新
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const updatedMove: Move = { ...lastMove };
    if (newMovesPlayed === 2 && combo.movesTotal === 3) {
      updatedMove.secondVertex = vertex;
    } else {
      updatedMove.secondVertex = vertex;
    }
    const newHistory = [...state.moveHistory.slice(0, -1), updatedMove];

    return {
      success: true,
      newState: {
        ...state,
        board: newBoard,
        moveHistory: newHistory,
        captures: newCaptures,
        koVertex,
        superGauge: newGauge,
        moveCount: newMoveCount,
        comboState: {
          ...combo,
          movesPlayed: newMovesPlayed,
          vertices: newVertices,
        },
        systemMessages: [...state.systemMessages, ...messages],
      },
      capturedStones: captured,
    };
  }

  // --- 通常着手 ---
  const move: Move = {
    type: 'place',
    vertex,
    player: state.currentPlayer,
  };

  // ゲージ: 手ボーナス + アゲハマボーナス
  let newGauge = updateGauge(state.superGauge, state.currentPlayer, GAUGE_CONFIG.gainPerMove);
  if (captured.length > 0) {
    newGauge = updateGauge(newGauge, state.currentPlayer, captured.length * GAUGE_CONFIG.gainPerCapture);
  }

  // ロック判定
  let newLocks = state.lockedStones;
  if (shouldEvaluateLocks(newMoveCount)) {
    newLocks = evaluateLockedTerritory(newBoard, state.lockedStones);
    messages.push(`${newMoveCount}手目: 陣地ロック判定実行`);
  }

  return {
    success: true,
    newState: {
      ...state,
      board: newBoard,
      currentPlayer: switchPlayer(state.currentPlayer),
      moveHistory: [...state.moveHistory, move],
      captures: newCaptures,
      consecutivePasses: 0,
      koVertex,
      superGauge: newGauge,
      lockedStones: newLocks,
      moveCount: newMoveCount,
      gamePhase: determinePhase(newMoveCount),
      systemMessages: messages.length > 0
        ? [...state.systemMessages, ...messages]
        : state.systemMessages,
    },
    capturedStones: captured,
  };
}

/**
 * コンボ技（双炮・三閃）を発動
 * 一手目を打ち、コンボ状態に入る
 */
export function activateCombo(
  state: GameState,
  type: SpecialMoveType,
  firstVertex: Vertex
): MoveResult {
  if (!canUseSpecialMove(state, type)) {
    const name = type === 'doubleMove' ? '双炮' : '三閃';
    if (type === 'doubleMove' && getDoubleMoveCooldownRemaining(state) > 0) {
      const remaining = getDoubleMoveCooldownRemaining(state);
      return { success: false, error: `${name}はクールタイム中です（残り${remaining}手）` };
    }
    return { success: false, error: `${name}を使用できません（ゲージ不足）` };
  }

  const validation = isValidMove(
    state.board, firstVertex, state.currentPlayer, state.koVertex, state.lockedStones
  );
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // 一手目を実行
  const { board: newBoard, captured } = executeMove(
    state.board, firstVertex, state.currentPlayer, state.lockedStones
  );
  const koVertex = detectKo(captured, firstVertex, newBoard);

  const newCaptures = { ...state.captures };
  if (state.currentPlayer === 1) {
    newCaptures.black += captured.length;
  } else {
    newCaptures.white += captured.length;
  }

  // ゲージ消費
  let newGauge = consumeGauge(state.superGauge, state.currentPlayer, SPECIAL_MOVE_COSTS[type]);
  // 手ボーナス + アゲハマボーナスは一手目にも付与
  newGauge = updateGauge(newGauge, state.currentPlayer, GAUGE_CONFIG.gainPerMove);
  if (captured.length > 0) {
    newGauge = updateGauge(newGauge, state.currentPlayer, captured.length * GAUGE_CONFIG.gainPerCapture);
  }

  const movesTotal = type === 'doubleMove' ? 2 : 3;
  const moveName = type === 'doubleMove' ? '💥双炮' : '⚡️三閃';

  const move: Move = {
    type: 'place',
    vertex: firstVertex,
    player: state.currentPlayer,
    specialMove: type,
  };

  const newMoveCount = state.moveCount + 1;

  const comboState: ComboState = {
    type,
    movesPlayed: 1,
    movesTotal,
    vertices: [firstVertex],
  };

  // 双炮のクールダウンを記録
  const newCooldown = { ...state.doubleMoveCooldown };
  if (type === 'doubleMove') {
    if (state.currentPlayer === 1) {
      newCooldown.black = newMoveCount;
    } else {
      newCooldown.white = newMoveCount;
    }
  }

  return {
    success: true,
    newState: {
      ...state,
      board: newBoard,
      moveHistory: [...state.moveHistory, move],
      captures: newCaptures,
      koVertex,
      superGauge: newGauge,
      moveCount: newMoveCount,
      comboState,
      doubleMoveCooldown: newCooldown,
      systemMessages: [
        ...state.systemMessages,
        `${getCurrentPlayerName(state.currentPlayer)}が${moveName}を発動！残り${movesTotal - 1}手`,
      ],
    },
    capturedStones: captured,
  };
}

/**
 * パスする
 */
export function pass(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  if (state.comboState) {
    return { success: false, error: 'コンボ中はパスできません。残りの手を打ってください' };
  }

  const move: Move = { type: 'pass', player: state.currentPlayer };
  const newConsecutivePasses = state.consecutivePasses + 1;
  const isGameOver = newConsecutivePasses >= 2;

  let gameResult = state.gameResult;
  const messages: string[] = [`${getCurrentPlayerName(state.currentPlayer)}がパス`];

  if (isGameOver) {
    const score = calculateScore(state.board);
    const winner = score.black > score.white ? 1 as PlayerColor
      : score.white > score.black ? -1 as PlayerColor
      : null;
    gameResult = { winner, method: 'doublePass', score };
    messages.push('両者パスにより終局');
    messages.push(`黒: ${score.black}目 / 白: ${score.white}目`);
  }

  return {
    success: true,
    newState: {
      ...state,
      currentPlayer: switchPlayer(state.currentPlayer),
      moveHistory: [...state.moveHistory, move],
      consecutivePasses: newConsecutivePasses,
      isGameOver,
      koVertex: null,
      gameResult,
      systemMessages: [...state.systemMessages, ...messages],
    },
  };
}

/**
 * 投了
 */
export function resign(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  const winner = switchPlayer(state.currentPlayer);
  const gameResult: GameResult = { winner, method: 'resign' };

  return {
    success: true,
    newState: {
      ...state,
      isGameOver: true,
      gameResult,
      comboState: null,
      systemMessages: [
        ...state.systemMessages,
        `${getCurrentPlayerName(state.currentPlayer)}が投了`,
        `${getCurrentPlayerName(winner)}の勝ち！`,
      ],
    },
  };
}

/**
 * AIによる裁定
 */
export function requestJudgment(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  const score = calculateScore(state.board);
  const winner = score.black > score.white ? 1 as PlayerColor
    : score.white > score.black ? -1 as PlayerColor
    : null;

  const gameResult: GameResult = { winner, method: 'judgment', score };

  const messages = [
    '裁判（AI裁定）を実行',
    `黒: ${score.black}目 / 白: ${score.white}目`,
  ];
  if (winner) {
    messages.push(`${getCurrentPlayerName(winner)}の勝ち！`);
  } else {
    messages.push('引き分け');
  }

  return {
    success: true,
    newState: {
      ...state,
      isGameOver: true,
      gameResult,
      comboState: null,
      systemMessages: [...state.systemMessages, ...messages],
    },
  };
}

/**
 * 1手戻す
 */
export function undo(state: GameState): MoveResult {
  if (state.moveHistory.length === 0) {
    return { success: false, error: '戻せる手がありません' };
  }

  // 最初から再構築する
  let newState = createInitialState();
  const movesToReplay = state.moveHistory.slice(0, -1);

  for (const move of movesToReplay) {
    if (move.type === 'place' && move.vertex) {
      if (move.specialMove) {
        const result = activateCombo(newState, move.specialMove, move.vertex);
        if (result.success && result.newState) {
          newState = result.newState;
          if (move.secondVertex) {
            const r2 = placeStone(newState, move.secondVertex);
            if (r2.success && r2.newState) newState = r2.newState;
          }
          if (move.thirdVertex) {
            const r3 = placeStone(newState, move.thirdVertex);
            if (r3.success && r3.newState) newState = r3.newState;
          }
        }
      } else {
        const result = placeStone(newState, move.vertex);
        if (result.success && result.newState) newState = result.newState;
      }
    } else if (move.type === 'pass') {
      const result = pass(newState);
      if (result.success && result.newState) newState = result.newState;
    }
  }

  return { success: true, newState };
}

/**
 * ゲームをリセット
 */
export function resetGame(): GameState {
  return createInitialState();
}

/**
 * 現在のプレイヤー名を取得
 */
export function getCurrentPlayerName(player: PlayerColor): string {
  return player === 1 ? '黒' : '白';
}
