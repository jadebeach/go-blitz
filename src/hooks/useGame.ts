/**
 * Go Blitz - 飛刀囲碁 ゲーム状態管理カスタムフック
 */

import { useState, useCallback } from 'react';
import type { GameState, Vertex } from '../game';
import {
  createInitialState,
  placeStone,
  activateDoubleMove,
  activateStoneFlip,
  toggleFlipMode,
  pass as passMove,
  resign as resignMove,
  requestJudgment as judgmentMove,
  undo as undoMove,
  resetGame,
  getPlayerGauge,
  canUseSpecialMove,
} from '../game';

interface UseGameReturn {
  gameState: GameState;
  canUndo: boolean;
  handleMove: (vertex: Vertex) => boolean;
  handlePass: () => void;
  handleUndo: () => void;
  handleReset: () => void;
  handleResign: () => void;
  handleJudgment: () => void;
  handleActivateDoubleMove: (vertex: Vertex) => boolean;
  handleActivateFlipMode: () => void;
  handleCancelFlipMode: () => void;
  handleFlipTarget: (vertex: Vertex) => boolean;
  currentGauge: number;
  canDoubleMove: boolean;
  canFlip: boolean;
  lastError: string | null;
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState()
  );
  const [lastError, setLastError] = useState<string | null>(null);

  // 石を置く（通常 or 二手打ちの二手目）
  const handleMove = useCallback((vertex: Vertex): boolean => {
    setLastError(null);
    let success = false;

    setGameState((current) => {
      // 鎌刀モード中はひっくり返しを実行
      if (current.isFlipMode) {
        const result = activateStoneFlip(current, vertex);
        if (result.success && result.newState) {
          success = true;
          return result.newState;
        }
        if (result.error) setLastError(result.error);
        return current;
      }

      const result = placeStone(current, vertex);
      if (result.success && result.newState) {
        success = true;
        return result.newState;
      }
      if (result.error) setLastError(result.error);
      return current;
    });

    return success;
  }, []);

  // 二手打ち発動（一手目を指定して発動）
  const handleActivateDoubleMove = useCallback((vertex: Vertex): boolean => {
    setLastError(null);
    let success = false;

    setGameState((current) => {
      const result = activateDoubleMove(current, vertex);
      if (result.success && result.newState) {
        success = true;
        return result.newState;
      }
      if (result.error) setLastError(result.error);
      return current;
    });

    return success;
  }, []);

  // 鎌刀モード切り替え
  const handleActivateFlipMode = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      if (!canUseSpecialMove(current, 'stoneFlip')) {
        setLastError('鎌刀を使用するにはゲージが足りません');
        return current;
      }
      return toggleFlipMode(current);
    });
  }, []);

  const handleCancelFlipMode = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      if (current.isFlipMode) {
        return { ...current, isFlipMode: false };
      }
      return current;
    });
  }, []);

  // 鎌刀のターゲット選択
  const handleFlipTarget = useCallback((vertex: Vertex): boolean => {
    setLastError(null);
    let success = false;

    setGameState((current) => {
      const result = activateStoneFlip(current, vertex);
      if (result.success && result.newState) {
        success = true;
        return result.newState;
      }
      if (result.error) setLastError(result.error);
      return current;
    });

    return success;
  }, []);

  // パス
  const handlePass = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = passMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  // 投了
  const handleResign = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = resignMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  // 裁判
  const handleJudgment = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = judgmentMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  // 待った
  const handleUndo = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = undoMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  // リセット
  const handleReset = useCallback(() => {
    setLastError(null);
    setGameState(resetGame());
  }, []);

  return {
    gameState,
    canUndo: gameState.moveHistory.length > 0 && !gameState.isDoubleMoveFirstStone,
    handleMove,
    handlePass,
    handleUndo,
    handleReset,
    handleResign,
    handleJudgment,
    handleActivateDoubleMove,
    handleActivateFlipMode,
    handleCancelFlipMode,
    handleFlipTarget,
    currentGauge: getPlayerGauge(gameState),
    canDoubleMove: canUseSpecialMove(gameState, 'doubleMove'),
    canFlip: canUseSpecialMove(gameState, 'stoneFlip'),
    lastError,
  };
}
