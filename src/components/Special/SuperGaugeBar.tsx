/**
 * スーパーゲージ表示コンポーネント
 * 格闘ゲーム風のゲージバー
 */

import { GAUGE_CONFIG } from '../../game';

interface SuperGaugeBarProps {
  gauge: number;
  player: 'black' | 'white';
  playerName: string;
}

export function SuperGaugeBar({ gauge, player, playerName }: SuperGaugeBarProps) {
  const percentage = (gauge / GAUGE_CONFIG.maxGauge) * 100;

  return (
    <div className={`gauge-container gauge-${player}`}>
      <div className="gauge-label">
        <span className={`stone-indicator stone-${player}`} />
        <span className="gauge-player-name">{playerName}</span>
        <span className="gauge-value">{gauge}/{GAUGE_CONFIG.maxGauge}</span>
      </div>
      <div className="gauge-bar-track">
        <div
          className={`gauge-bar-fill gauge-fill-${player}`}
          style={{ width: `${percentage}%` }}
        />
        {/* ゲージ区切り線 */}
        {Array.from({ length: GAUGE_CONFIG.maxGauge - 1 }, (_, i) => (
          <div
            key={i}
            className="gauge-notch"
            style={{ left: `${((i + 1) / GAUGE_CONFIG.maxGauge) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
