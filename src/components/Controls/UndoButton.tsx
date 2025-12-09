/**
 * 待ったボタンコンポーネント
 */

interface UndoButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function UndoButton({ onClick, disabled = false }: UndoButtonProps) {
  return (
    <button
      className="control-button undo-button"
      onClick={onClick}
      disabled={disabled}
      title="1手戻す"
    >
      待った
    </button>
  );
}
