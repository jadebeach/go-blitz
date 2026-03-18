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
export type SpecialMoveType = 'doubleMove' | 'tripleMove';

// 着手情報
export interface Move {
  type: MoveType;
  vertex?: Vertex;
  player: PlayerColor;
  specialMove?: SpecialMoveType;
  // 双炮の2手目
  secondVertex?: Vertex;
  // 三閃の2手目・3手目
  thirdVertex?: Vertex;
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
  doubleMove: 8,    // 💥双炮: 8ゲージ消費、連続2手
  tripleMove: 16,   // ⚡️三閃: 16ゲージ消費、連続3手
};

// ゲージ設定
export const GAUGE_CONFIG = {
  maxGauge: 16,            // 最大ゲージ
  gainPerMove: 1,          // 1手ごとのゲージ増加量
  gainPerCapture: 1,       // 1目取り上げるごとに+1ゲージ
  lockMoveThreshold: 51,   // 陣地ロック判定の手数
  lockInterval: 30,        // 以降のロック判定間隔 (51, 81, 111...)
  gaugeDisplayUnits: 8,    // ゲージUI表示単位数
  doubleMoveCooldown: 2,   // 双炮のクールタイム（使用後N手経過で再発動可能）
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

// コンボ状態（双炮・三閃の途中経過）
export interface ComboState {
  type: SpecialMoveType;
  movesPlayed: number;   // 何手打ったか
  movesTotal: number;    // 合計何手打てるか (2 or 3)
  vertices: Vertex[];    // 打った座標の履歴
}

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
  // コンボ状態（双炮・三閃の途中）
  comboState: ComboState | null;
  // 双炮クールダウン: 各プレイヤーが最後に双炮を使った手数（null=未使用）
  doubleMoveCooldown: {
    black: number | null;
    white: number | null;
  };
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
