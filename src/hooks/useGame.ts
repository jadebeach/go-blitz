/**
 * ゲーム状態管理カスタムフック
 * UIとゲームロジックを接続
 */

import { useState, useCallback } from 'react';
import type { GameState, GameConfig, Vertex } from '../game';
import {
  createInitialState,
  placeStone,
  pass as passMove,
  undo as undoMove,
  resetGame,
} from '../game';

type BoardSize = 9 | 13 | 19;

interface UseGameOptions {
  initialBoardSize?: BoardSize;
}

interface UseGameReturn {
  gameState: GameState;
  boardSize: BoardSize;
  canUndo: boolean;
  handleMove: (vertex: Vertex) => boolean;
  handlePass: () => void;
  handleUndo: () => void;
  handleReset: () => void;
  handleBoardSizeChange: (size: BoardSize) => void;
  lastError: string | null;
}

export function useGame(options: UseGameOptions = {}): UseGameReturn {
  const { initialBoardSize = 9 } = options;

  const [boardSize, setBoardSize] = useState<BoardSize>(initialBoardSize);
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState({ boardSize: initialBoardSize })
  );
  const [lastError, setLastError] = useState<string | null>(null);

  // 石を置く
  const handleMove = useCallback((vertex: Vertex): boolean => {
    setLastError(null);

    setGameState((current) => {
      const result = placeStone(current, vertex);
      if (result.success && result.newState) {
        return result.newState;
      }
      // エラーの場合は状態を変更せず、エラーメッセージを設定
      if (result.error) {
        setLastError(result.error);
      }
      return current;
    });

    return true;
  }, []);

  // パス
  const handlePass = useCallback(() => {
    setLastError(null);

    setGameState((current) => {
      const result = passMove(current);
      if (result.success && result.newState) {
        return result.newState;
      }
      if (result.error) {
        setLastError(result.error);
      }
      return current;
    });
  }, []);

  // 待った（1手戻す）
  const handleUndo = useCallback(() => {
    setLastError(null);

    setGameState((current) => {
      const result = undoMove(current);
      if (result.success && result.newState) {
        return result.newState;
      }
      if (result.error) {
        setLastError(result.error);
      }
      return current;
    });
  }, []);

  // リセット
  const handleReset = useCallback(() => {
    setLastError(null);
    setGameState(resetGame(gameState));
  }, [gameState]);

  // 盤面サイズ変更
  const handleBoardSizeChange = useCallback((size: BoardSize) => {
    setLastError(null);
    setBoardSize(size);
    const config: GameConfig = { boardSize: size };
    setGameState(createInitialState(config));
  }, []);

  return {
    gameState,
    boardSize,
    canUndo: gameState.moveHistory.length > 0,
    handleMove,
    handlePass,
    handleUndo,
    handleReset,
    handleBoardSizeChange,
    lastError,
  };
}
