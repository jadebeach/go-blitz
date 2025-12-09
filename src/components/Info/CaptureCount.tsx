/**
 * アゲハマ（取った石）表示コンポーネント
 */

interface CaptureCountProps {
  blackCaptures: number;
  whiteCaptures: number;
}

export function CaptureCount({ blackCaptures, whiteCaptures }: CaptureCountProps) {
  return (
    <div className="capture-count">
      <div className="capture-item">
        <span className="stone-indicator stone-black" />
        <span>黒のアゲハマ: {blackCaptures}</span>
      </div>
      <div className="capture-item">
        <span className="stone-indicator stone-white" />
        <span>白のアゲハマ: {whiteCaptures}</span>
      </div>
    </div>
  );
}
