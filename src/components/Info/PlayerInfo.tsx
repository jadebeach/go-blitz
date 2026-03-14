/**
 * プレイヤー情報表示コンポーネント
 */

import type { PlayerColor, ComboState } from '../../game';

interface PlayerInfoProps {
  currentPlayer: PlayerColor;
  isGameOver: boolean;
  comboState?: ComboState | null;
}

export function PlayerInfo({
  currentPlayer,
  isGameOver,
  comboState = null,
}: PlayerInfoProps) {
  const playerName = currentPlayer === 1 ? '黒' : '白';
  const stoneClass = currentPlayer === 1 ? 'stone-black' : 'stone-white';

  return (
    <div className="player-info">
      {isGameOver ? (
        <div className="game-over-message">ゲーム終了</div>
      ) : (
        <div className="current-turn">
          <span className={`stone-indicator ${stoneClass}`} />
          <span>{playerName}の番</span>
          {comboState && (
            <span className={`special-mode-badge ${comboState.type === 'doubleMove' ? 'double-move-badge' : 'triple-move-badge'}`}>
              {comboState.type === 'doubleMove' ? '💥双炮' : '⚡️三閃'}
              {' '}残り{comboState.movesTotal - comboState.movesPlayed}手
            </span>
          )}
        </div>
      )}
    </div>
  );
}
