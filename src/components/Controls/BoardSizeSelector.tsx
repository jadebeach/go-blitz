/**
 * 盤面サイズ選択コンポーネント
 */

type BoardSize = 9 | 13 | 19;

interface BoardSizeSelectorProps {
  currentSize: BoardSize;
  onChange: (size: BoardSize) => void;
  disabled?: boolean;
}

const BOARD_SIZES: BoardSize[] = [9, 13, 19];

export function BoardSizeSelector({
  currentSize,
  onChange,
  disabled = false,
}: BoardSizeSelectorProps) {
  return (
    <div className="board-size-selector">
      <label htmlFor="board-size">盤面サイズ: </label>
      <select
        id="board-size"
        value={currentSize}
        onChange={(e) => onChange(Number(e.target.value) as BoardSize)}
        disabled={disabled}
      >
        {BOARD_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}路盤
          </option>
        ))}
      </select>
    </div>
  );
}
