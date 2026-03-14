/**
 * インタラクティブな碁盤コンポーネント
 * ゴーストストーン、ロック表示、コンボ状態対応
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
  isComboActive?: boolean;
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
  isComboActive = false,
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
      if (getStone(board, hoverVertex) === 0) {
        ghostMap[y][x] = {
          sign: currentPlayer,
          faint: true,
        };
      }
    }

    return ghostMap;
  }, [board, hoverVertex, currentPlayer, disabled]);

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
      if (disabled && !isComboActive) return;
      onMove?.(vertex);
    },
    [disabled, isComboActive, onMove]
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
  if (disabled && !isComboActive) cursorStyle = 'not-allowed';

  return (
    <div
      className={`interactive-goban ${isComboActive ? 'combo-active' : ''}`}
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
