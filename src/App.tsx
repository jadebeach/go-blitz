/**
 * Go Blitz - 飛刀囲碁 x 格闘ゲーム バリアント
 * 野狐囲碁風UIレイアウト
 */

import { useState } from 'react';
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
    handleActivateDoubleMove,
    handleActivateFlipMode,
    handleCancelFlipMode,
    currentGauge,
    canDoubleMove,
    canFlip,
    lastError,
  } = useGame();

  // 二手打ちモード: 次のクリックを二手打ちの一手目にする
  const [doubleMoveMode, setDoubleMoveMode] = useState(false);

  const onBoardClick = (vertex: [number, number]) => {
    if (doubleMoveMode && !gameState.isDoubleMoveFirstStone) {
      const success = handleActivateDoubleMove(vertex);
      if (success) {
        setDoubleMoveMode(false);
      }
      return;
    }
    handleMove(vertex);
  };

  const onActivateDoubleMoveClick = () => {
    if (gameState.isDoubleMoveFirstStone) return;
    setDoubleMoveMode(true);
  };

  const blackGauge = getPlayerGauge(gameState, 1);
  const whiteGauge = getPlayerGauge(gameState, -1);

  return (
    <div className="app">
      {/* ヘッダー: プレイヤー情報バー */}
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
        {/* 左サイドバー: ゲージ + 必殺技 */}
        <aside className="sidebar sidebar-left">
          <SuperGaugeBar gauge={blackGauge} player="black" playerName="黒" />
          <SuperGaugeBar gauge={whiteGauge} player="white" playerName="白" />

          <SpecialMoveButtons
            gauge={currentGauge}
            moveCount={gameState.moveCount}
            isGameOver={gameState.isGameOver}
            isDoubleMoveActive={doubleMoveMode || gameState.isDoubleMoveFirstStone}
            isFlipModeActive={gameState.isFlipMode}
            canDoubleMove={canDoubleMove}
            canFlip={canFlip}
            onActivateDoubleMove={onActivateDoubleMoveClick}
            onActivateFlip={handleActivateFlipMode}
            onCancelFlip={handleCancelFlipMode}
          />
        </aside>

        {/* 中央: 碁盤 */}
        <div className="board-section">
          {(doubleMoveMode || gameState.isDoubleMoveFirstStone) && (
            <div className="board-overlay-label double-move-label">
              {doubleMoveMode ? '二手打ち: 一手目を選択' : '二手打ち: 二手目を選択'}
            </div>
          )}
          {gameState.isFlipMode && (
            <div className="board-overlay-label flip-label">
              鎌刀: ひっくり返す中心を選択
            </div>
          )}
          <InteractiveGoban
            board={gameState.board}
            currentPlayer={gameState.currentPlayer}
            disabled={gameState.isGameOver}
            lockedStones={gameState.lockedStones}
            isFlipMode={gameState.isFlipMode}
            isDoubleMoveActive={gameState.isDoubleMoveFirstStone}
            onMove={onBoardClick}
            maxWidth={480}
            maxHeight={480}
          />
          {lastError && (
            <div className="error-message">{lastError}</div>
          )}
        </div>

        {/* 右サイドバー: 情報 + コントロール */}
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

      {/* 下部: システムメッセージ */}
      <footer className="app-footer">
        <SystemMessages messages={gameState.systemMessages} maxDisplay={4} />
      </footer>
    </div>
  );
}

export default App;
