/**
 * ゲームモジュールのエクスポート
 */

// 型定義
export type {
  Stone,
  Vertex,
  BoardState,
  PlayerColor,
  MoveType,
  Move,
  Capture,
  GameState,
  GameConfig,
  MoveResult,
} from './types';

// ルール関数
export {
  createEmptyBoard,
  copyBoard,
  isValidVertex,
  getStone,
  setStone,
  getNeighbors,
  getGroup,
  countLiberties,
  findCaptures,
  removeStones,
  isSuicide,
  isValidMove,
  executeMove,
  detectKo,
} from './rules';

// ゲーム状態管理
export {
  createInitialState,
  placeStone,
  pass,
  undo,
  resetGame,
  getCurrentPlayerName,
} from './gameState';
