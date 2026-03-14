/**
 * 必殺技ボタンコンポーネント
 */

import type { SpecialMoveType } from '../../game';
import { SPECIAL_MOVE_COSTS, GAUGE_CONFIG } from '../../game';

interface SpecialMoveButtonsProps {
  gauge: number;
  moveCount: number;
  isGameOver: boolean;
  isDoubleMoveActive: boolean;
  isFlipModeActive: boolean;
  canDoubleMove: boolean;
  canFlip: boolean;
  onActivateDoubleMove: () => void;
  onActivateFlip: () => void;
  onCancelFlip: () => void;
}

function getSpecialMoveLabel(type: SpecialMoveType): string {
  switch (type) {
    case 'doubleMove': return '二手打ち';
    case 'stoneFlip': return '鎌刀';
  }
}

function getSpecialMoveDescription(type: SpecialMoveType): string {
  switch (type) {
    case 'doubleMove': return '連続で2手打てる';
    case 'stoneFlip': return '相手の石をひっくり返す';
  }
}

export function SpecialMoveButtons({
  gauge,
  moveCount,
  isGameOver,
  isDoubleMoveActive,
  isFlipModeActive,
  canDoubleMove,
  canFlip,
  onActivateDoubleMove,
  onActivateFlip,
  onCancelFlip,
}: SpecialMoveButtonsProps) {
  const doubleMoveAvailable = moveCount >= GAUGE_CONFIG.doubleMoveStartMove
    && moveCount <= GAUGE_CONFIG.doubleMoveEndMove;

  return (
    <div className="special-moves-panel">
      <h3 className="special-moves-title">必殺技</h3>

      <div className="special-move-buttons">
        {/* 二手打ち */}
        <button
          className={`special-move-btn double-move-btn ${isDoubleMoveActive ? 'active' : ''} ${!doubleMoveAvailable ? 'unavailable' : ''}`}
          disabled={isGameOver || !canDoubleMove || isFlipModeActive || isDoubleMoveActive}
          onClick={onActivateDoubleMove}
          title={getSpecialMoveDescription('doubleMove')}
        >
          <span className="special-move-icon">⚡</span>
          <span className="special-move-name">{getSpecialMoveLabel('doubleMove')}</span>
          <span className="special-move-cost">
            {SPECIAL_MOVE_COSTS.doubleMove}
          </span>
          {!doubleMoveAvailable && (
            <span className="special-move-restriction">
              {moveCount < GAUGE_CONFIG.doubleMoveStartMove ? `${GAUGE_CONFIG.doubleMoveStartMove}手目から` : '期間終了'}
            </span>
          )}
          {isDoubleMoveActive && (
            <span className="special-move-active-label">2手目を打て！</span>
          )}
        </button>

        {/* 鎌刀 */}
        <button
          className={`special-move-btn flip-btn ${isFlipModeActive ? 'active' : ''}`}
          disabled={isGameOver || (!canFlip && !isFlipModeActive) || isDoubleMoveActive}
          onClick={isFlipModeActive ? onCancelFlip : onActivateFlip}
          title={getSpecialMoveDescription('stoneFlip')}
        >
          <span className="special-move-icon">🗡️</span>
          <span className="special-move-name">{getSpecialMoveLabel('stoneFlip')}</span>
          <span className="special-move-cost">
            {SPECIAL_MOVE_COSTS.stoneFlip}
          </span>
          {isFlipModeActive && (
            <span className="special-move-active-label">対象を選択 / キャンセル</span>
          )}
        </button>
      </div>

      {/* ゲージ残量表示 */}
      <div className="gauge-remaining">
        残りゲージ: <strong>{gauge}</strong>
        {moveCount >= GAUGE_CONFIG.gaugeStopMove && (
          <span className="gauge-stopped"> (ゲージ停止中)</span>
        )}
      </div>
    </div>
  );
}
