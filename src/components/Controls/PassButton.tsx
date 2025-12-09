/**
 * パスボタンコンポーネント
 */

interface PassButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function PassButton({ onClick, disabled = false }: PassButtonProps) {
  return (
    <button
      className="control-button pass-button"
      onClick={onClick}
      disabled={disabled}
      title="パスする"
    >
      パス
    </button>
  );
}
