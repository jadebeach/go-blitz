/**
 * プレイヤー情報表示コンポーネント
 */

import type { PlayerColor } from '../../game';

interface PlayerInfoProps {
  currentPlayer: PlayerColor;
  isGameOver: boolean;
  isDoubleMoveActive?: boolean;
  isFlipMode?: boolean;
}

export function PlayerInfo({
  currentPlayer,
  isGameOver,
  isDoubleMoveActive = false,
  isFlipMode = false,
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
          {isDoubleMoveActive && (
            <span className="special-mode-badge double-move-badge">二手打ち中</span>
          )}
          {isFlipMode && (
            <span className="special-mode-badge flip-mode-badge">鎌刀選択中</span>
          )}
        </div>
      )}
    </div>
  );
}
