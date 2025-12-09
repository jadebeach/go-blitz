/**
 * ゲーム情報パネル
 * プレイヤー情報、アゲハマ、履歴をまとめて表示
 */

import { PlayerInfo } from './PlayerInfo';
import { CaptureCount } from './CaptureCount';
import { MoveHistory } from './MoveHistory';
import type { GameState } from '../../game';

interface GameInfoProps {
  gameState: GameState;
}

export function GameInfo({ gameState }: GameInfoProps) {
  return (
    <div className="game-info">
      <PlayerInfo
        currentPlayer={gameState.currentPlayer}
        isGameOver={gameState.isGameOver}
      />
      <CaptureCount
        blackCaptures={gameState.captures.black}
        whiteCaptures={gameState.captures.white}
      />
      <MoveHistory moves={gameState.moveHistory} />
    </div>
  );
}
