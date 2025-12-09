/**
 * インタラクティブな碁盤コンポーネント
 * ゴーストストーン（プレビュー）機能付き
 */

import { useState, useCallback } from 'react';
import { BoundedGoban as ShudanBoundedGoban } from '@sabaki/shudan';
import '@sabaki/shudan/css/goban.css';
import type { BoardState, Vertex, PlayerColor, Stone } from '../../game';
import { getStone } from '../../game';

// ゴーストストーンの型
type GhostStoneType = 'good' | 'interesting' | 'doubtful' | 'bad' | null;
type GhostStone = { sign: Stone; type?: GhostStoneType; faint?: boolean } | null;
type GhostStoneMap = GhostStone[][];

// Preact/React互換性のためanyにキャスト
const BoundedGoban = ShudanBoundedGoban as unknown as React.ComponentType<{
  maxWidth?: number;
  maxHeight?: number;
  signMap: number[][];
  ghostStoneMap?: GhostStoneMap;
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
  onMove?: (vertex: Vertex) => void;
}

export function InteractiveGoban({
  board,
  currentPlayer,
  disabled = false,
  maxWidth = 500,
  maxHeight = 500,
  showCoordinates = true,
  onMove,
}: InteractiveGobanProps) {
  const [hoverVertex, setHoverVertex] = useState<Vertex | null>(null);

  // ゴーストストーンマップを生成
  const createGhostStoneMap = useCallback((): GhostStoneMap => {
    const size = board.length;
    const ghostMap: GhostStoneMap = Array.from({ length: size }, () =>
      Array(size).fill(null)
    );

    if (hoverVertex && !disabled) {
      const [x, y] = hoverVertex;
      // 空いている場所のみゴーストを表示
      if (getStone(board, hoverVertex) === 0) {
        ghostMap[y][x] = {
          sign: currentPlayer,
          faint: true,
        };
      }
    }

    return ghostMap;
  }, [board, hoverVertex, currentPlayer, disabled]);

  const handleVertexClick = useCallback(
    (_evt: unknown, vertex: [number, number]) => {
      if (disabled) return;
      onMove?.(vertex);
    },
    [disabled, onMove]
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

  return (
    <div
      className="interactive-goban"
      onMouseLeave={handleMouseLeave}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <BoundedGoban
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        signMap={board}
        ghostStoneMap={createGhostStoneMap()}
        showCoordinates={showCoordinates}
        fuzzyStonePlacement={true}
        animateStonePlacement={true}
        onVertexClick={handleVertexClick}
        onVertexMouseMove={handleVertexMouseMove}
      />
    </div>
  );
}
