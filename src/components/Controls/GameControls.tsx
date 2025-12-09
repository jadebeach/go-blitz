/**
 * ゲームコントロールパネル
 * 複数のコントロールボタンをまとめて表示
 */

import { PassButton } from './PassButton';
import { UndoButton } from './UndoButton';
import { ResetButton } from './ResetButton';
import { BoardSizeSelector } from './BoardSizeSelector';

type BoardSize = 9 | 13 | 19;

interface GameControlsProps {
  boardSize: BoardSize;
  canUndo: boolean;
  isGameOver: boolean;
  onPass: () => void;
  onUndo: () => void;
  onReset: () => void;
  onBoardSizeChange: (size: BoardSize) => void;
}

export function GameControls({
  boardSize,
  canUndo,
  isGameOver,
  onPass,
  onUndo,
  onReset,
  onBoardSizeChange,
}: GameControlsProps) {
  return (
    <div className="game-controls">
      <div className="control-buttons">
        <PassButton onClick={onPass} disabled={isGameOver} />
        <UndoButton onClick={onUndo} disabled={!canUndo} />
        <ResetButton onClick={onReset} />
      </div>
      <BoardSizeSelector
        currentSize={boardSize}
        onChange={onBoardSizeChange}
      />
    </div>
  );
}
