/**
 * Shudanの碁盤コンポーネントのラッパー
 */

import { BoundedGoban as ShudanBoundedGoban } from '@sabaki/shudan';
import '@sabaki/shudan/css/goban.css';
import type { BoardState, Vertex } from '../../game';

// Preact/React互換性のためanyにキャスト
const BoundedGoban = ShudanBoundedGoban as unknown as React.ComponentType<{
  maxWidth?: number;
  maxHeight?: number;
  signMap: number[][];
  showCoordinates?: boolean;
  fuzzyStonePlacement?: boolean;
  animateStonePlacement?: boolean;
  onVertexClick?: (evt: unknown, vertex: [number, number]) => void;
  onVertexMouseMove?: (evt: unknown, vertex: [number, number] | null) => void;
}>;

interface GobanWrapperProps {
  board: BoardState;
  maxWidth?: number;
  maxHeight?: number;
  showCoordinates?: boolean;
  onVertexClick?: (vertex: Vertex) => void;
  onVertexMouseMove?: (vertex: Vertex | null) => void;
}

export function GobanWrapper({
  board,
  maxWidth = 500,
  maxHeight = 500,
  showCoordinates = true,
  onVertexClick,
  onVertexMouseMove,
}: GobanWrapperProps) {
  const handleVertexClick = (
    _evt: unknown,
    vertex: [number, number]
  ) => {
    onVertexClick?.(vertex);
  };

  const handleVertexMouseMove = (
    _evt: unknown,
    vertex: [number, number] | null
  ) => {
    onVertexMouseMove?.(vertex);
  };

  return (
    <BoundedGoban
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      signMap={board}
      showCoordinates={showCoordinates}
      fuzzyStonePlacement={true}
      animateStonePlacement={true}
      onVertexClick={handleVertexClick}
      onVertexMouseMove={handleVertexMouseMove}
    />
  );
}
