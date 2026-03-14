/**
 * Go Blitz - 飛刀囲碁 x 格闘ゲーム バリアント型定義
 */

// 石の種類: 0=空, 1=黒, -1=白
export type Stone = 0 | 1 | -1;

// 盤面の座標 [x, y]
export type Vertex = [number, number];

// 盤面の状態（2次元配列）
export type BoardState = Stone[][];

// プレイヤーの色
export type PlayerColor = 1 | -1;

// 着手の種類
export type MoveType = 'place' | 'pass';

// 必殺技の種類
export type SpecialMoveType = 'doubleMove' | 'stoneFlip';

// 着手情報
export interface Move {
  type: MoveType;
  vertex?: Vertex;
  player: PlayerColor;
  specialMove?: SpecialMoveType;
  // 二手打ちの2手目
  secondVertex?: Vertex;
  // ひっくり返した石
  flippedStones?: Vertex[];
}

// 取られた石の情報
export interface Capture {
  stones: Vertex[];
  player: PlayerColor;
}

// スーパーゲージ
export interface SuperGauge {
  black: number;
  white: number;
}

// 必殺技のコスト定義
export const SPECIAL_MOVE_COSTS: Record<SpecialMoveType, number> = {
  doubleMove: 3,   // 二手打ち: 3ゲージ消費
  stoneFlip: 5,    // 鎌刀（ひっくり返し）: 5ゲージ消費
};

// ゲージ設定
export const GAUGE_CONFIG = {
  maxGauge: 10,          // 最大ゲージ
  gainPerMove: 1,        // 1手ごとのゲージ増加量
  lockMoveThreshold: 50, // 陣地ロック判定の手数
  lockInterval: 35,      // 以降のロック判定間隔
  gaugeStopMove: 90,     // これ以降ゲージが貯まらなくなる
  doubleMoveStartMove: 11, // 二手打ち解禁手数（野狐囲碁準拠: 11手目から）
  doubleMoveEndMove: 50,   // 二手打ち終了手数
};

// ロックされた石の情報
export type LockedStones = boolean[][];

// 終局方法
export type EndGameMethod = 'resign' | 'judgment' | 'doublePass';

// 終局結果
export interface GameResult {
  winner: PlayerColor | null; // null = 引き分け
  method: EndGameMethod;
  score?: {
    black: number;
    white: number;
  };
}

// ゲームフェーズ
export type GamePhase = 'opening' | 'midgame' | 'endgame';

// ゲームの状態
export interface GameState {
  boardSize: number;
  board: BoardState;
  currentPlayer: PlayerColor;
  moveHistory: Move[];
  captures: {
    black: number;
    white: number;
  };
  consecutivePasses: number;
  isGameOver: boolean;
  koVertex: Vertex | null;
  // 飛刀囲碁拡張
  superGauge: SuperGauge;
  lockedStones: LockedStones;
  moveCount: number;
  gamePhase: GamePhase;
  gameResult: GameResult | null;
  // 二手打ちの一手目を打った状態
  isDoubleMoveFirstStone: boolean;
  doubleMoveFirstVertex: Vertex | null;
  // 鎌刀（ひっくり返し）選択モード
  isFlipMode: boolean;
  // システムメッセージ
  systemMessages: string[];
}

// ゲーム設定（11路盤固定）
export interface GameConfig {
  boardSize: 11;
}

// 着手の結果
export interface MoveResult {
  success: boolean;
  newState?: GameState;
  error?: string;
  capturedStones?: Vertex[];
}
