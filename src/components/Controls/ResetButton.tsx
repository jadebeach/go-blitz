/**
 * リセットボタンコンポーネント
 */

interface ResetButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ResetButton({ onClick, disabled = false }: ResetButtonProps) {
  return (
    <button
      className="control-button reset-button"
      onClick={onClick}
      disabled={disabled}
      title="最初からやり直す"
    >
      リセット
    </button>
  );
}
