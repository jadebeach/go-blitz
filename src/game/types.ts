/**
 * 囲碁ゲームの型定義
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

// 着手情報
export interface Move {
  type: MoveType;
  vertex?: Vertex;
  player: PlayerColor;
}

// 取られた石の情報
export interface Capture {
  stones: Vertex[];
  player: PlayerColor;
}

// ゲームの状態
export interface GameState {
  boardSize: number;
  board: BoardState;
  currentPlayer: PlayerColor;
  moveHistory: Move[];
  captures: {
    black: number; // 黒が取った石の数
    white: number; // 白が取った石の数
  };
  consecutivePasses: number;
  isGameOver: boolean;
  koVertex: Vertex | null; // コウで打てない場所
}

// ゲーム設定
export interface GameConfig {
  boardSize: 9 | 13 | 19;
  handicap?: number;
  komi?: number;
}

// 着手の結果
export interface MoveResult {
  success: boolean;
  newState?: GameState;
  error?: string;
  capturedStones?: Vertex[];
}
