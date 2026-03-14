/**
 * スーパーゲージ表示コンポーネント
 * 8単位表示、色ティア:
 *   1~8: 水色
 *   9~16: オレンジ
 *   MAX(16): ピンク〜オレンジ グラデーション（動くアニメーション）
 */

import { GAUGE_CONFIG } from '../../game';

interface SuperGaugeBarProps {
  gauge: number;
  player: 'black' | 'white';
  playerName: string;
}

type GaugeTier = 'low' | 'high' | 'max';

function getGaugeTier(gauge: number): GaugeTier {
  if (gauge >= GAUGE_CONFIG.maxGauge) return 'max';
  if (gauge > GAUGE_CONFIG.gaugeDisplayUnits) return 'high';
  return 'low';
}

export function SuperGaugeBar({ gauge, player, playerName }: SuperGaugeBarProps) {
  const units = GAUGE_CONFIG.gaugeDisplayUnits; // 8
  const tier = getGaugeTier(gauge);

  // ゲージの見え方: 8単位に収める
  // 1~8  → そのまま 1~8 幅で水色
  // 9~16 → 1~8 幅でオレンジ（下地に水色フル）
  // 16   → フル幅でピンク〜オレンジアニメ

  const lowerFill = Math.min(gauge, units); // 0~8
  const upperFill = gauge > units ? gauge - units : 0; // 0~8
  const lowerPct = (lowerFill / units) * 100;
  const upperPct = (upperFill / units) * 100;

  return (
    <div className={`gauge-container gauge-${player}`}>
      <div className="gauge-label">
        <span className={`stone-indicator stone-${player}`} />
        <span className="gauge-player-name">{playerName}</span>
        <span className={`gauge-value gauge-value-${tier}`}>
          {gauge}/{GAUGE_CONFIG.maxGauge}
        </span>
      </div>
      <div className="gauge-bar-track">
        {/* 下層: 水色（1~8） */}
        <div
          className="gauge-bar-fill gauge-tier-low"
          style={{ width: `${lowerPct}%` }}
        />
        {/* 上層: オレンジ（9~16） */}
        {upperFill > 0 && (
          <div
            className={`gauge-bar-fill gauge-tier-high ${tier === 'max' ? 'gauge-tier-max' : ''}`}
            style={{ width: `${upperPct}%` }}
          />
        )}
        {/* ノッチ線 */}
        {Array.from({ length: units - 1 }, (_, i) => (
          <div
            key={i}
            className="gauge-notch"
            style={{ left: `${((i + 1) / units) * 100}%` }}
          />
        ))}
      </div>
      {/* ティア表示 */}
      <div className="gauge-tier-labels">
        <span className={`gauge-tier-dot ${gauge >= 1 ? 'tier-active-low' : ''}`} />
        <span className={`gauge-tier-dot ${gauge > units ? 'tier-active-high' : ''}`} />
        <span className={`gauge-tier-dot ${tier === 'max' ? 'tier-active-max' : ''}`} />
      </div>
    </div>
  );
}
