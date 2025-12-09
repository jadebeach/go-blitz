/**
 * 囲碁ゲームアプリケーション
 */

import { useGame } from './hooks';
import { InteractiveGoban } from './components/Board';
import { GameControls } from './components/Controls';
import { GameInfo } from './components/Info';
import './App.css';

function App() {
  const {
    gameState,
    boardSize,
    canUndo,
    handleMove,
    handlePass,
    handleUndo,
    handleReset,
    handleBoardSizeChange,
    lastError,
  } = useGame({ initialBoardSize: 9 });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Go Blitz</h1>
      </header>

      <main className="app-main">
        <div className="game-container">
          <div className="board-section">
            <InteractiveGoban
              board={gameState.board}
              currentPlayer={gameState.currentPlayer}
              disabled={gameState.isGameOver}
              onMove={handleMove}
              maxWidth={450}
              maxHeight={450}
            />
            {lastError && (
              <div className="error-message">{lastError}</div>
            )}
          </div>

          <aside className="sidebar">
            <GameInfo gameState={gameState} />
            <GameControls
              boardSize={boardSize}
              canUndo={canUndo}
              isGameOver={gameState.isGameOver}
              onPass={handlePass}
              onUndo={handleUndo}
              onReset={handleReset}
              onBoardSizeChange={handleBoardSizeChange}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
