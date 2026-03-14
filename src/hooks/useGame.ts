/**
 * Go Blitz - 飛刀囲碁 ゲーム状態管理カスタムフック
 */

import { useState, useCallback, useRef } from 'react';
import type { GameState, Vertex, SpecialMoveType } from '../game';
import {
  createInitialState,
  placeStone,
  activateCombo,
  pass as passMove,
  resign as resignMove,
  requestJudgment as judgmentMove,
  undo as undoMove,
  resetGame,
  getPlayerGauge,
  canUseSpecialMove,
} from '../game';

export { activateCombo } from '../game';

interface UseGameReturn {
  gameState: GameState;
  canUndo: boolean;
  handleMove: (vertex: Vertex) => boolean;
  handlePass: () => void;
  handleUndo: () => void;
  handleReset: () => void;
  handleResign: () => void;
  handleJudgment: () => void;
  pendingComboType: SpecialMoveType | null;
  setPendingComboType: (type: SpecialMoveType | null) => void;
  canDoubleMove: boolean;
  canTripleMove: boolean;
  currentGauge: number;
  lastError: string | null;
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const [lastError, setLastError] = useState<string | null>(null);
  const [pendingComboType, setPendingComboType] = useState<SpecialMoveType | null>(null);

  // Ref でコンボ待ち型を追跡（setGameState コールバック内で最新値を参照するため）
  const pendingComboRef = useRef<SpecialMoveType | null>(null);

  const setPendingCombo = useCallback((type: SpecialMoveType | null) => {
    pendingComboRef.current = type;
    setPendingComboType(type);
  }, []);

  // 盤面クリック: 通常着手 / コンボ発動 / コンボ継続
  const handleMove = useCallback((vertex: Vertex): boolean => {
    setLastError(null);
    let success = false;

    setGameState((current) => {
      // 1) コンボ継続中 → placeStone がコンボ処理を行う
      if (current.comboState) {
        const result = placeStone(current, vertex);
        if (result.success && result.newState) {
          success = true;
          return result.newState;
        }
        if (result.error) setLastError(result.error);
        return current;
      }

      // 2) コンボ発動待ち → activateCombo で一手目
      const pending = pendingComboRef.current;
      if (pending) {
        const result = activateCombo(current, pending, vertex);
        if (result.success && result.newState) {
          success = true;
          // 発動成功 → pending をクリア
          pendingComboRef.current = null;
          setPendingComboType(null);
          return result.newState;
        }
        if (result.error) setLastError(result.error);
        return current;
      }

      // 3) 通常着手
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

  const handlePass = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = passMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  const handleResign = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = resignMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  const handleJudgment = useCallback(() => {
    setLastError(null);
    setGameState((current) => {
      const result = judgmentMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setLastError(null);
    setPendingCombo(null);
    setGameState((current) => {
      const result = undoMove(current);
      if (result.success && result.newState) return result.newState;
      if (result.error) setLastError(result.error);
      return current;
    });
  }, [setPendingCombo]);

  const handleReset = useCallback(() => {
    setLastError(null);
    setPendingCombo(null);
    setGameState(resetGame());
  }, [setPendingCombo]);

  return {
    gameState,
    canUndo: gameState.moveHistory.length > 0 && !gameState.comboState,
    handleMove,
    handlePass,
    handleUndo,
    handleReset,
    handleResign,
    handleJudgment,
    pendingComboType,
    setPendingComboType: setPendingCombo,
    canDoubleMove: canUseSpecialMove(gameState, 'doubleMove'),
    canTripleMove: canUseSpecialMove(gameState, 'tripleMove'),
    currentGauge: getPlayerGauge(gameState),
    lastError,
  };
}
