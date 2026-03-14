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
  SpecialMoveType,
  Move,
  Capture,
  SuperGauge,
  LockedStones,
  EndGameMethod,
  GameResult,
  GamePhase,
  ComboState,
  GameState,
  GameConfig,
  MoveResult,
} from './types';

// 定数
export { SPECIAL_MOVE_COSTS, GAUGE_CONFIG } from './types';

// ルール関数
export {
  createEmptyBoard,
  createEmptyLockMap,
  copyBoard,
  copyLockMap,
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
  evaluateLockedTerritory,
  hasTwoEyes,
  calculateScore,
} from './rules';

// ゲーム状態管理
export {
  createInitialState,
  placeStone,
  activateCombo,
  pass,
  resign,
  requestJudgment,
  undo,
  resetGame,
  getCurrentPlayerName,
  getPlayerGauge,
  canUseSpecialMove,
} from './gameState';
