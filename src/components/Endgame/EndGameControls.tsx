/**
 * 終局コントロールコンポーネント
 * 投了・裁判・結局の3つの終局方法
 */

import type { GameResult, PlayerColor } from '../../game';

interface EndGameControlsProps {
  isGameOver: boolean;
  gameResult: GameResult | null;
  currentPlayer: PlayerColor;
  onResign: () => void;
  onJudgment: () => void;
  onPass: () => void;
}

export function EndGameControls({
  isGameOver,
  gameResult,
  currentPlayer,
  onResign,
  onJudgment,
  onPass,
}: EndGameControlsProps) {
  if (isGameOver && gameResult) {
    return (
      <div className="endgame-result">
        <div className="result-header">
          {gameResult.method === 'resign' && '投了'}
          {gameResult.method === 'judgment' && '裁判（AI裁定）'}
          {gameResult.method === 'doublePass' && '結局（両者パス）'}
        </div>
        <div className="result-winner">
          {gameResult.winner
            ? `${gameResult.winner === 1 ? '黒' : '白'}の勝ち`
            : '引き分け'
          }
        </div>
        {gameResult.score && (
          <div className="result-score">
            <span>黒: {gameResult.score.black}目</span>
            <span>白: {gameResult.score.white}目</span>
          </div>
        )}
      </div>
    );
  }

  const playerName = currentPlayer === 1 ? '黒' : '白';

  return (
    <div className="endgame-controls">
      <button
        className="endgame-btn resign-btn"
        onClick={onResign}
        disabled={isGameOver}
      >
        🏳️ 認輸（投了）
      </button>

      <button
        className="endgame-btn judgment-btn"
        onClick={onJudgment}
        disabled={isGameOver}
      >
        ⚖️ 裁判
      </button>

      <button
        className="endgame-btn pass-btn"
        onClick={onPass}
        disabled={isGameOver}
      >
        ⏭️ パス
      </button>

      <div className="endgame-hint">
        {playerName}の番 — 打つ場所がなければパス、両者パスで結局
      </div>
    </div>
  );
}
