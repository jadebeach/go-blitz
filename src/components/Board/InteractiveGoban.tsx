/**
 * インタラクティブな碁盤コンポーネント
 * ゴーストストーン、ロック表示、鎌刀モード対応
 */

import { useState, useCallback } from 'react';
import { BoundedGoban as ShudanBoundedGoban } from '@sabaki/shudan';
import '@sabaki/shudan/css/goban.css';
import type { BoardState, Vertex, PlayerColor, Stone, LockedStones } from '../../game';
import { getStone } from '../../game';

type GhostStone = { sign: Stone; type?: string; faint?: boolean } | null;
type GhostStoneMap = GhostStone[][];
type MarkerMap = (Record<string, unknown> | null)[][];

const BoundedGoban = ShudanBoundedGoban as unknown as React.ComponentType<{
  maxWidth?: number;
  maxHeight?: number;
  signMap: number[][];
  ghostStoneMap?: GhostStoneMap;
  markerMap?: MarkerMap;
  showCoordinates?: boolean;
  fuzzyStonePlacement?: boolean;
  animateStonePlacement?: boolean;
  onVertexClick?: (evt: unknown, vertex: [number, number]) => void;
  onVertexMouseMove?: (evt: unknown, vertex: [number, number] | null) => void;
}>;

interface InteractiveGobanProps {
  board: BoardState;
  currentPlayer: PlayerColor;
  disabled?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  showCoordinates?: boolean;
  lockedStones?: LockedStones;
  isFlipMode?: boolean;
  isDoubleMoveActive?: boolean;
  onMove?: (vertex: Vertex) => void;
}

export function InteractiveGoban({
  board,
  currentPlayer,
  disabled = false,
  maxWidth = 500,
  maxHeight = 500,
  showCoordinates = true,
  lockedStones,
  isFlipMode = false,
  isDoubleMoveActive = false,
  onMove,
}: InteractiveGobanProps) {
  const [hoverVertex, setHoverVertex] = useState<Vertex | null>(null);

  const createGhostStoneMap = useCallback((): GhostStoneMap => {
    const size = board.length;
    const ghostMap: GhostStoneMap = Array.from({ length: size }, () =>
      Array(size).fill(null)
    );

    if (hoverVertex && !disabled) {
      const [x, y] = hoverVertex;
      if (isFlipMode) {
        // 鎌刀モード: ターゲット範囲をハイライト
        const opponent = -currentPlayer as Stone;
        const targets: Vertex[] = [
          [x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
        ];
        for (const [tx, ty] of targets) {
          if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
            if (getStone(board, [tx, ty]) === opponent) {
              ghostMap[ty][tx] = { sign: currentPlayer, type: 'good', faint: true };
            }
          }
        }
      } else if (getStone(board, hoverVertex) === 0) {
        ghostMap[y][x] = {
          sign: currentPlayer,
          faint: true,
        };
      }
    }

    return ghostMap;
  }, [board, hoverVertex, currentPlayer, disabled, isFlipMode]);

  // ロックされた石にマーカーを表示
  const createMarkerMap = useCallback((): MarkerMap => {
    const size = board.length;
    const markers: MarkerMap = Array.from({ length: size }, () =>
      Array(size).fill(null)
    );

    if (lockedStones) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (lockedStones[y][x] && board[y][x] !== 0) {
            markers[y][x] = { type: 'point' };
          }
        }
      }
    }

    return markers;
  }, [board, lockedStones]);

  const handleVertexClick = useCallback(
    (_evt: unknown, vertex: [number, number]) => {
      if (disabled && !isFlipMode && !isDoubleMoveActive) return;
      onMove?.(vertex);
    },
    [disabled, isFlipMode, isDoubleMoveActive, onMove]
  );

  const handleVertexMouseMove = useCallback(
    (_evt: unknown, vertex: [number, number] | null) => {
      setHoverVertex(vertex);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoverVertex(null);
  }, []);

  let cursorStyle = 'pointer';
  if (disabled && !isFlipMode && !isDoubleMoveActive) cursorStyle = 'not-allowed';
  if (isFlipMode) cursorStyle = 'crosshair';

  return (
    <div
      className={`interactive-goban ${isFlipMode ? 'flip-mode' : ''} ${isDoubleMoveActive ? 'double-move-mode' : ''}`}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: cursorStyle }}
    >
      <BoundedGoban
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        signMap={board}
        ghostStoneMap={createGhostStoneMap()}
        markerMap={createMarkerMap()}
        showCoordinates={showCoordinates}
        fuzzyStonePlacement={true}
        animateStonePlacement={true}
        onVertexClick={handleVertexClick}
        onVertexMouseMove={handleVertexMouseMove}
      />
    </div>
  );
}
