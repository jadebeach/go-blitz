/**
 * 必殺技ボタンコンポーネント
 * 💥双炮（8ゲージ: 2連打）、⚡️三閃（16ゲージ: 3連打）
 */

import { SPECIAL_MOVE_COSTS } from '../../game';
import type { ComboState } from '../../game';

interface SpecialMoveButtonsProps {
  gauge: number;
  isGameOver: boolean;
  comboState: ComboState | null;
  pendingComboType: string | null;
  canDoubleMove: boolean;
  canTripleMove: boolean;
  onActivateDoubleMove: () => void;
  onActivateTripleMove: () => void;
  onCancelPending: () => void;
}

export function SpecialMoveButtons({
  gauge,
  isGameOver,
  comboState,
  pendingComboType,
  canDoubleMove,
  canTripleMove,
  onActivateDoubleMove,
  onActivateTripleMove,
  onCancelPending,
}: SpecialMoveButtonsProps) {
  const inCombo = comboState !== null;
  const isPendingDouble = pendingComboType === 'doubleMove';
  const isPendingTriple = pendingComboType === 'tripleMove';

  return (
    <div className="special-moves-panel">
      <h3 className="special-moves-title">必殺技</h3>

      <div className="special-move-buttons">
        {/* 💥双炮 */}
        <button
          className={`special-move-btn double-move-btn ${isPendingDouble || (comboState?.type === 'doubleMove') ? 'active' : ''}`}
          disabled={isGameOver || (!canDoubleMove && !isPendingDouble) || inCombo || isPendingTriple}
          onClick={isPendingDouble ? onCancelPending : onActivateDoubleMove}
          title="連続で2手打てる"
        >
          <span className="special-move-icon">💥</span>
          <span className="special-move-name">双炮</span>
          <span className="special-move-cost">{SPECIAL_MOVE_COSTS.doubleMove}</span>
          {isPendingDouble && (
            <span className="special-move-active-label">盤面をクリック / キャンセル</span>
          )}
          {comboState?.type === 'doubleMove' && (
            <span className="special-move-active-label">
              残り{comboState.movesTotal - comboState.movesPlayed}手！
            </span>
          )}
        </button>

        {/* ⚡️三閃 */}
        <button
          className={`special-move-btn triple-move-btn ${isPendingTriple || (comboState?.type === 'tripleMove') ? 'active' : ''}`}
          disabled={isGameOver || (!canTripleMove && !isPendingTriple) || inCombo || isPendingDouble}
          onClick={isPendingTriple ? onCancelPending : onActivateTripleMove}
          title="連続で3手打てる"
        >
          <span className="special-move-icon">⚡️</span>
          <span className="special-move-name">三閃</span>
          <span className="special-move-cost">{SPECIAL_MOVE_COSTS.tripleMove}</span>
          {isPendingTriple && (
            <span className="special-move-active-label">盤面をクリック / キャンセル</span>
          )}
          {comboState?.type === 'tripleMove' && (
            <span className="special-move-active-label">
              残り{comboState.movesTotal - comboState.movesPlayed}手！
            </span>
          )}
        </button>
      </div>

      <div className="gauge-remaining">
        残りゲージ: <strong>{gauge}</strong>
      </div>
    </div>
  );
}
