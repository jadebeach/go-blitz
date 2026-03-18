/**
 * Go Blitz - 飛刀囲碁 x 格闘ゲーム バリアント
 */

import { useGame } from './hooks';
import { InteractiveGoban } from './components/Board';
import { GameInfo } from './components/Info';
import { SuperGaugeBar, SpecialMoveButtons } from './components/Special';
import { EndGameControls } from './components/Endgame';
import { SystemMessages } from './components/System';
import { getPlayerGauge } from './game';
import './App.css';

function App() {
  const {
    gameState,
    canUndo,
    handleMove,
    handlePass,
    handleUndo,
    handleReset,
    handleResign,
    handleJudgment,
    pendingComboType,
    setPendingComboType,
    canDoubleMove,
    canTripleMove,
    doubleMoveCooldown,
    currentGauge,
    lastError,
  } = useGame();

  const blackGauge = getPlayerGauge(gameState, 1);
  const whiteGauge = getPlayerGauge(gameState, -1);

  const comboLabel = gameState.comboState
    ? gameState.comboState.type === 'doubleMove'
      ? `💥双炮: 残り${gameState.comboState.movesTotal - gameState.comboState.movesPlayed}手`
      : `⚡️三閃: 残り${gameState.comboState.movesTotal - gameState.comboState.movesPlayed}手`
    : pendingComboType === 'doubleMove'
      ? '💥双炮: 一手目を選択'
      : pendingComboType === 'tripleMove'
        ? '⚡️三閃: 一手目を選択'
        : null;

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <div className="header-player header-black">
          <div className="header-avatar">
            <span className="stone-indicator stone-black" />
          </div>
          <div className="header-player-info">
            <span className="header-player-name">黒</span>
            <span className="header-player-rank">刀手</span>
          </div>
          <div className="header-timer">
            {gameState.currentPlayer === 1 && !gameState.isGameOver && (
              <span className="timer-active">●</span>
            )}
          </div>
        </div>

        <div className="header-center">
          <div className="header-title">Go Blitz</div>
          <div className="header-subtitle">飛刀囲碁</div>
          <div className="header-move-count">{gameState.moveCount}手</div>
        </div>

        <div className="header-player header-white">
          <div className="header-timer">
            {gameState.currentPlayer === -1 && !gameState.isGameOver && (
              <span className="timer-active">●</span>
            )}
          </div>
          <div className="header-player-info">
            <span className="header-player-name">白</span>
            <span className="header-player-rank">刀侠</span>
          </div>
          <div className="header-avatar">
            <span className="stone-indicator stone-white" />
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* 左サイドバー */}
        <aside className="sidebar sidebar-left">
          <SuperGaugeBar gauge={blackGauge} player="black" playerName="黒" />
          <SuperGaugeBar gauge={whiteGauge} player="white" playerName="白" />

          <SpecialMoveButtons
            gauge={currentGauge}
            isGameOver={gameState.isGameOver}
            comboState={gameState.comboState}
            pendingComboType={pendingComboType}
            canDoubleMove={canDoubleMove}
            canTripleMove={canTripleMove}
            doubleMoveCooldown={doubleMoveCooldown}
            onActivateDoubleMove={() => setPendingComboType('doubleMove')}
            onActivateTripleMove={() => setPendingComboType('tripleMove')}
            onCancelPending={() => setPendingComboType(null)}
          />
        </aside>

        {/* 碁盤 */}
        <div className="board-section">
          {comboLabel && (
            <div className={`board-overlay-label ${
              (gameState.comboState?.type === 'tripleMove' || pendingComboType === 'tripleMove')
                ? 'triple-label' : 'double-label'
            }`}>
              {comboLabel}
            </div>
          )}
          <InteractiveGoban
            board={gameState.board}
            currentPlayer={gameState.currentPlayer}
            disabled={gameState.isGameOver}
            lockedStones={gameState.lockedStones}
            isComboActive={!!gameState.comboState}
            onMove={handleMove}
            maxWidth={560}
            maxHeight={560}
          />
          {lastError && (
            <div className="error-message">{lastError}</div>
          )}
        </div>

        {/* 右サイドバー */}
        <aside className="sidebar sidebar-right">
          <GameInfo gameState={gameState} />

          <EndGameControls
            isGameOver={gameState.isGameOver}
            gameResult={gameState.gameResult}
            currentPlayer={gameState.currentPlayer}
            onResign={handleResign}
            onJudgment={handleJudgment}
            onPass={handlePass}
          />

          <div className="game-controls">
            <button
              className="control-button undo-button"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              ⏪ 待った
            </button>
            <button
              className="control-button reset-button"
              onClick={handleReset}
            >
              🔄 リセット
            </button>
          </div>
        </aside>
      </main>

      {/* システムメッセージ */}
      <footer className="app-footer">
        <SystemMessages messages={gameState.systemMessages} maxDisplay={4} />
      </footer>
    </div>
  );
}

export default App;
