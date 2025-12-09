/**
 * ゲーム状態管理
 * ゲームの状態遷移を管理する純粋関数
 */

import type {
  GameState,
  GameConfig,
  Vertex,
  PlayerColor,
  Move,
  MoveResult,
} from './types';
import {
  createEmptyBoard,
  isValidMove,
  executeMove,
  detectKo,
} from './rules';

/**
 * 初期ゲーム状態を作成
 */
export function createInitialState(config: GameConfig): GameState {
  const { boardSize } = config;

  return {
    boardSize,
    board: createEmptyBoard(boardSize),
    currentPlayer: 1, // 黒先
    moveHistory: [],
    captures: {
      black: 0,
      white: 0,
    },
    consecutivePasses: 0,
    isGameOver: false,
    koVertex: null,
  };
}

/**
 * プレイヤーを交代
 */
function switchPlayer(player: PlayerColor): PlayerColor {
  return player === 1 ? -1 : 1;
}

/**
 * 石を置く
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
    state.koVertex
  );

  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // 着手を実行
  const { board: newBoard, captured } = executeMove(
    state.board,
    vertex,
    state.currentPlayer
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

  // 新しい着手を記録
  const move: Move = {
    type: 'place',
    vertex,
    player: state.currentPlayer,
  };

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: switchPlayer(state.currentPlayer),
    moveHistory: [...state.moveHistory, move],
    captures: newCaptures,
    consecutivePasses: 0,
    koVertex,
  };

  return {
    success: true,
    newState,
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

  const move: Move = {
    type: 'pass',
    player: state.currentPlayer,
  };

  const newConsecutivePasses = state.consecutivePasses + 1;
  const isGameOver = newConsecutivePasses >= 2;

  const newState: GameState = {
    ...state,
    currentPlayer: switchPlayer(state.currentPlayer),
    moveHistory: [...state.moveHistory, move],
    consecutivePasses: newConsecutivePasses,
    isGameOver,
    koVertex: null, // パス後はコウが解消
  };

  return {
    success: true,
    newState,
  };
}

/**
 * 1手戻す
 */
export function undo(state: GameState): MoveResult {
  if (state.moveHistory.length === 0) {
    return { success: false, error: '戻せる手がありません' };
  }

  // 最初から再構築する（シンプルな実装）
  const config: GameConfig = { boardSize: state.boardSize as 9 | 13 | 19 };
  let newState = createInitialState(config);

  // 最後の1手を除いて再実行
  const movesToReplay = state.moveHistory.slice(0, -1);
  for (const move of movesToReplay) {
    if (move.type === 'place' && move.vertex) {
      const result = placeStone(newState, move.vertex);
      if (result.success && result.newState) {
        newState = result.newState;
      }
    } else if (move.type === 'pass') {
      const result = pass(newState);
      if (result.success && result.newState) {
        newState = result.newState;
      }
    }
  }

  return {
    success: true,
    newState,
  };
}

/**
 * ゲームをリセット
 */
export function resetGame(state: GameState): GameState {
  const config: GameConfig = { boardSize: state.boardSize as 9 | 13 | 19 };
  return createInitialState(config);
}

/**
 * 現在のプレイヤー名を取得
 */
export function getCurrentPlayerName(player: PlayerColor): string {
  return player === 1 ? '黒' : '白';
}
