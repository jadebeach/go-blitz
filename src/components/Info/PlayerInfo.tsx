/**
 * プレイヤー情報表示コンポーネント
 */

import type { PlayerColor } from '../../game';

interface PlayerInfoProps {
  currentPlayer: PlayerColor;
  isGameOver: boolean;
}

export function PlayerInfo({ currentPlayer, isGameOver }: PlayerInfoProps) {
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
        </div>
      )}
    </div>
  );
}
