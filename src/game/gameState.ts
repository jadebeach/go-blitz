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
} from './types';
import { SPECIAL_MOVE_COSTS, GAUGE_CONFIG } from './types';
import {
  createEmptyBoard,
  createEmptyLockMap,
  isValidMove,
  executeMove,
  detectKo,
  executeStoneFlip,
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
    captures: {
      black: 0,
      white: 0,
    },
    consecutivePasses: 0,
    isGameOver: false,
    koVertex: null,
    // 飛刀囲碁拡張
    superGauge: { black: 0, white: 0 },
    lockedStones: createEmptyLockMap(boardSize),
    moveCount: 0,
    gamePhase: 'opening',
    gameResult: null,
    isDoubleMoveFirstStone: false,
    doubleMoveFirstVertex: null,
    isFlipMode: false,
    systemMessages: ['ゲーム開始！11路盤 飛刀囲碁モード'],
  };
}

/**
 * プレイヤーを交代
 */
function switchPlayer(player: PlayerColor): PlayerColor {
  return player === 1 ? -1 : 1;
}

/**
 * ゲームフェーズを判定
 */
function determinePhase(moveCount: number): GamePhase {
  if (moveCount < 20) return 'opening';
  if (moveCount < 60) return 'midgame';
  return 'endgame';
}

/**
 * ゲージを加算（条件付き）
 */
function addGauge(gauge: number, moveCount: number): number {
  if (moveCount >= GAUGE_CONFIG.gaugeStopMove) return gauge;
  return Math.min(gauge + GAUGE_CONFIG.gainPerMove, GAUGE_CONFIG.maxGauge);
}

/**
 * 現在のプレイヤーのゲージを取得
 */
export function getPlayerGauge(state: GameState, player?: PlayerColor): number {
  const p = player ?? state.currentPlayer;
  return p === 1 ? state.superGauge.black : state.superGauge.white;
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

  const gauge = getPlayerGauge(state, player);
  const cost = SPECIAL_MOVE_COSTS[type];

  if (gauge < cost) return false;

  // 二手打ちは11手目〜50手目のみ
  if (type === 'doubleMove') {
    if (state.moveCount < GAUGE_CONFIG.doubleMoveStartMove) return false;
    if (state.moveCount > GAUGE_CONFIG.doubleMoveEndMove) return false;
  }

  return true;
}

/**
 * 陣地ロック判定が必要かチェック
 */
function shouldEvaluateLocks(moveCount: number): boolean {
  if (moveCount === GAUGE_CONFIG.lockMoveThreshold) return true;
  if (moveCount > GAUGE_CONFIG.lockMoveThreshold) {
    return (moveCount - GAUGE_CONFIG.lockMoveThreshold) % GAUGE_CONFIG.lockInterval === 0;
  }
  return false;
}

/**
 * 石を置く
 */
export function placeStone(state: GameState, vertex: Vertex): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  // 鎌刀モード中は通常の着手不可
  if (state.isFlipMode) {
    return { success: false, error: '鎌刀の対象を選んでください' };
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
    state.board,
    vertex,
    state.currentPlayer,
    state.lockedStones
  );

  // コウを検出
  const koVertex = detectKo(captured, vertex, newBoard);

  // 取った石をカウント
  const newCaptures = { ...state.captures };
  if (state.currentPlayer === 1) {
    newCaptures.black += captured.length;
  } else {
    newCaptures.white += captured.length;
  }

  const newMoveCount = state.moveCount + 1;
  const messages: string[] = [];

  // 二手打ちの一手目の場合
  if (state.isDoubleMoveFirstStone) {
    // 二手打ちの二手目を記録
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const updatedMove: Move = {
      ...lastMove,
      secondVertex: vertex,
    };

    const newHistory = [...state.moveHistory.slice(0, -1), updatedMove];

    // ゲージは一手目で消費済み、プレイヤー交代
    const newGauge = { ...state.superGauge };
    // 二手目でもゲージは溜まる
    if (state.currentPlayer === 1) {
      newGauge.black = addGauge(newGauge.black, newMoveCount);
    } else {
      newGauge.white = addGauge(newGauge.white, newMoveCount);
    }

    // ロック判定
    let newLocks = state.lockedStones;
    if (shouldEvaluateLocks(newMoveCount)) {
      newLocks = evaluateLockedTerritory(newBoard, state.lockedStones);
      messages.push(`${newMoveCount}手目: 陣地ロック判定実行`);
    }

    messages.push(`${getCurrentPlayerName(state.currentPlayer)}が二手打ち完了`);

    const newState: GameState = {
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
      isDoubleMoveFirstStone: false,
      doubleMoveFirstVertex: null,
      systemMessages: [...state.systemMessages, ...messages],
    };

    return { success: true, newState, capturedStones: captured };
  }

  // 通常の着手
  const move: Move = {
    type: 'place',
    vertex,
    player: state.currentPlayer,
  };

  // ゲージ加算
  const newGauge = { ...state.superGauge };
  if (state.currentPlayer === 1) {
    newGauge.black = addGauge(newGauge.black, newMoveCount);
  } else {
    newGauge.white = addGauge(newGauge.white, newMoveCount);
  }

  // ロック判定
  let newLocks = state.lockedStones;
  if (shouldEvaluateLocks(newMoveCount)) {
    newLocks = evaluateLockedTerritory(newBoard, state.lockedStones);
    messages.push(`${newMoveCount}手目: 陣地ロック判定実行`);
  }

  const newState: GameState = {
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
  };

  return {
    success: true,
    newState,
    capturedStones: captured,
  };
}

/**
 * 二手打ち（ダブルムーブ）を発動
 * 一手目を打ち、二手目の入力待ちにする
 */
export function activateDoubleMove(state: GameState, firstVertex: Vertex): MoveResult {
  if (!canUseSpecialMove(state, 'doubleMove')) {
    return { success: false, error: '二手打ちを使用できません' };
  }

  // 着手の有効性チェック
  const validation = isValidMove(
    state.board,
    firstVertex,
    state.currentPlayer,
    state.koVertex,
    state.lockedStones
  );

  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // 一手目を実行
  const { board: newBoard, captured } = executeMove(
    state.board,
    firstVertex,
    state.currentPlayer,
    state.lockedStones
  );

  const koVertex = detectKo(captured, firstVertex, newBoard);

  const newCaptures = { ...state.captures };
  if (state.currentPlayer === 1) {
    newCaptures.black += captured.length;
  } else {
    newCaptures.white += captured.length;
  }

  // ゲージ消費
  const newGauge = { ...state.superGauge };
  if (state.currentPlayer === 1) {
    newGauge.black -= SPECIAL_MOVE_COSTS.doubleMove;
  } else {
    newGauge.white -= SPECIAL_MOVE_COSTS.doubleMove;
  }

  const move: Move = {
    type: 'place',
    vertex: firstVertex,
    player: state.currentPlayer,
    specialMove: 'doubleMove',
  };

  const newMoveCount = state.moveCount + 1;

  const newState: GameState = {
    ...state,
    board: newBoard,
    moveHistory: [...state.moveHistory, move],
    captures: newCaptures,
    koVertex,
    superGauge: newGauge,
    moveCount: newMoveCount,
    isDoubleMoveFirstStone: true,
    doubleMoveFirstVertex: firstVertex,
    systemMessages: [
      ...state.systemMessages,
      `${getCurrentPlayerName(state.currentPlayer)}が二手打ちを発動！`,
    ],
  };

  return { success: true, newState, capturedStones: captured };
}

/**
 * 鎌刀（ひっくり返し）を発動
 */
export function activateStoneFlip(state: GameState, targetVertex: Vertex): MoveResult {
  if (!canUseSpecialMove(state, 'stoneFlip')) {
    return { success: false, error: '鎌刀を使用できません' };
  }

  // ゲージ消費
  const newGauge = { ...state.superGauge };
  if (state.currentPlayer === 1) {
    newGauge.black -= SPECIAL_MOVE_COSTS.stoneFlip;
  } else {
    newGauge.white -= SPECIAL_MOVE_COSTS.stoneFlip;
  }

  // ひっくり返し実行
  const { board: newBoard, flippedStones } = executeStoneFlip(
    state.board,
    targetVertex,
    state.currentPlayer,
    state.lockedStones
  );

  if (flippedStones.length === 0) {
    return { success: false, error: 'ひっくり返せる石がありません' };
  }

  const move: Move = {
    type: 'place',
    vertex: targetVertex,
    player: state.currentPlayer,
    specialMove: 'stoneFlip',
    flippedStones,
  };

  const newMoveCount = state.moveCount + 1;
  const messages = [
    `${getCurrentPlayerName(state.currentPlayer)}が鎌刀を使用！${flippedStones.length}個の石をひっくり返した`,
  ];

  // ロック判定
  let newLocks = state.lockedStones;
  if (shouldEvaluateLocks(newMoveCount)) {
    newLocks = evaluateLockedTerritory(newBoard, state.lockedStones);
    messages.push(`${newMoveCount}手目: 陣地ロック判定実行`);
  }

  // ゲージ加算
  if (state.currentPlayer === 1) {
    newGauge.black = addGauge(newGauge.black, newMoveCount);
  } else {
    newGauge.white = addGauge(newGauge.white, newMoveCount);
  }

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: switchPlayer(state.currentPlayer),
    moveHistory: [...state.moveHistory, move],
    koVertex: null,
    superGauge: newGauge,
    lockedStones: newLocks,
    moveCount: newMoveCount,
    gamePhase: determinePhase(newMoveCount),
    isFlipMode: false,
    systemMessages: [...state.systemMessages, ...messages],
  };

  return { success: true, newState };
}

/**
 * 鎌刀モードを開始/キャンセル
 */
export function toggleFlipMode(state: GameState): GameState {
  if (state.isFlipMode) {
    return { ...state, isFlipMode: false };
  }
  if (!canUseSpecialMove(state, 'stoneFlip')) {
    return state;
  }
  return { ...state, isFlipMode: true };
}

/**
 * パスする
 */
export function pass(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  if (state.isDoubleMoveFirstStone) {
    return { success: false, error: '二手打ちの二手目を打ってください' };
  }

  const move: Move = {
    type: 'pass',
    player: state.currentPlayer,
  };

  const newConsecutivePasses = state.consecutivePasses + 1;
  const isGameOver = newConsecutivePasses >= 2;

  let gameResult = state.gameResult;
  const messages: string[] = [`${getCurrentPlayerName(state.currentPlayer)}がパス`];

  if (isGameOver) {
    const score = calculateScore(state.board);
    const winner = score.black > score.white ? 1 as PlayerColor
      : score.white > score.black ? -1 as PlayerColor
      : null;
    gameResult = {
      winner,
      method: 'doublePass',
      score,
    };
    messages.push('両者パスにより終局');
    messages.push(`黒: ${score.black}目 / 白: ${score.white}目`);
  }

  const newState: GameState = {
    ...state,
    currentPlayer: switchPlayer(state.currentPlayer),
    moveHistory: [...state.moveHistory, move],
    consecutivePasses: newConsecutivePasses,
    isGameOver,
    koVertex: null,
    gameResult,
    systemMessages: [...state.systemMessages, ...messages],
  };

  return { success: true, newState };
}

/**
 * 投了（Resign）
 */
export function resign(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  const winner = switchPlayer(state.currentPlayer);
  const gameResult: GameResult = {
    winner,
    method: 'resign',
  };

  const newState: GameState = {
    ...state,
    isGameOver: true,
    gameResult,
    systemMessages: [
      ...state.systemMessages,
      `${getCurrentPlayerName(state.currentPlayer)}が投了`,
      `${getCurrentPlayerName(winner)}の勝ち！`,
    ],
  };

  return { success: true, newState };
}

/**
 * AIによる裁定（Judgment）
 * 簡易的に地を数えて判定
 */
export function requestJudgment(state: GameState): MoveResult {
  if (state.isGameOver) {
    return { success: false, error: 'ゲームは終了しています' };
  }

  const score = calculateScore(state.board);
  const winner = score.black > score.white ? 1 as PlayerColor
    : score.white > score.black ? -1 as PlayerColor
    : null;

  const gameResult: GameResult = {
    winner,
    method: 'judgment',
    score,
  };

  const messages = [
    '裁判（AI裁定）を実行',
    `黒: ${score.black}目 / 白: ${score.white}目`,
  ];

  if (winner) {
    messages.push(`${getCurrentPlayerName(winner)}の勝ち！`);
  } else {
    messages.push('引き分け');
  }

  const newState: GameState = {
    ...state,
    isGameOver: true,
    gameResult,
    systemMessages: [...state.systemMessages, ...messages],
  };

  return { success: true, newState };
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
      if (move.specialMove === 'doubleMove') {
        const result = activateDoubleMove(newState, move.vertex);
        if (result.success && result.newState) {
          newState = result.newState;
          if (move.secondVertex) {
            const result2 = placeStone(newState, move.secondVertex);
            if (result2.success && result2.newState) {
              newState = result2.newState;
            }
          }
        }
      } else if (move.specialMove === 'stoneFlip') {
        newState = { ...newState, isFlipMode: true };
        const result = activateStoneFlip(newState, move.vertex);
        if (result.success && result.newState) {
          newState = result.newState;
        }
      } else {
        const result = placeStone(newState, move.vertex);
        if (result.success && result.newState) {
          newState = result.newState;
        }
      }
    } else if (move.type === 'pass') {
      const result = pass(newState);
      if (result.success && result.newState) {
        newState = result.newState;
      }
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
