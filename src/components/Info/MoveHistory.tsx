/**
 * 着手履歴表示コンポーネント
 */

import type { Move } from '../../game';

interface MoveHistoryProps {
  moves: Move[];
  maxDisplay?: number;
}

function formatMove(move: Move, index: number): string {
  const playerName = move.player === 1 ? '黒' : '白';
  const moveNumber = index + 1;

  if (move.type === 'pass') {
    return `${moveNumber}. ${playerName}: パス`;
  }

  if (move.vertex) {
    const [x, y] = move.vertex;
    const colLabel = String.fromCharCode('A'.charCodeAt(0) + x);
    const rowLabel = y + 1;
    return `${moveNumber}. ${playerName}: ${colLabel}${rowLabel}`;
  }

  return `${moveNumber}. ${playerName}: ?`;
}

export function MoveHistory({ moves, maxDisplay = 10 }: MoveHistoryProps) {
  const displayMoves = moves.slice(-maxDisplay);
  const hiddenCount = moves.length - displayMoves.length;

  return (
    <div className="move-history">
      <h4>着手履歴</h4>
      {moves.length === 0 ? (
        <p className="no-moves">まだ着手がありません</p>
      ) : (
        <>
          {hiddenCount > 0 && (
            <div className="hidden-moves">... {hiddenCount}手省略</div>
          )}
          <ul className="move-list">
            {displayMoves.map((move, i) => (
              <li key={hiddenCount + i}>{formatMove(move, hiddenCount + i)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
