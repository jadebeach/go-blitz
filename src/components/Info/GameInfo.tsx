/**
 * ゲーム情報パネル
 */

import { PlayerInfo } from './PlayerInfo';
import { CaptureCount } from './CaptureCount';
import { MoveHistory } from './MoveHistory';
import type { GameState } from '../../game';

interface GameInfoProps {
  gameState: GameState;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'opening': return '序盤';
    case 'midgame': return '中盤';
    case 'endgame': return '終盤';
    default: return '';
  }
}

export function GameInfo({ gameState }: GameInfoProps) {
  return (
    <div className="game-info">
      <div className="game-status-bar">
        <span className="move-counter">{gameState.moveCount}手</span>
        <span className="game-phase-label">{getPhaseLabel(gameState.gamePhase)}</span>
      </div>
      <PlayerInfo
        currentPlayer={gameState.currentPlayer}
        isGameOver={gameState.isGameOver}
        comboState={gameState.comboState}
      />
      <CaptureCount
        blackCaptures={gameState.captures.black}
        whiteCaptures={gameState.captures.white}
      />
      <MoveHistory moves={gameState.moveHistory} />
    </div>
  );
}
