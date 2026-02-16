import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
import './styles/game-structure.css'
import './App.css'

const SYMBOLS = [
  { id: 'ring-red', icon: '⭕', value: 2, border: 'red' },
  { id: 'square-blue', icon: '■', value: 2, border: 'blue' },
  { id: 'triangle-red', icon: '▲', value: 4, border: 'red' },
  { id: 'triangle-green', icon: '▲', value: 3, border: 'green' },
  { id: 'ring-green', icon: '⭕', value: 4, border: 'green' },
  { id: 'diamond-purple', icon: '◆', value: 1, border: 'purple' },
  { id: 'square-purple', icon: '■', value: 1, border: 'purple' },
  { id: 'ring-blue', icon: '⭕', value: 3, border: 'blue' }
]
const PATTERNS = ['same', 'different', 'sequence', 'group']

function generateMatch(level) {
  const symbolCount = Math.min(4 + Math.floor(level / 2), 8)
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  
  let symbols = []
  let targetSymbols = []
  
  switch (pattern) {
    case 'same':
      const sameSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      symbols = Array.from({ length: symbolCount }, () => sameSymbol)
      targetSymbols = [sameSymbol, SYMBOLS.find(s => s.id !== sameSymbol.id)]
      break
      
    case 'different':
      symbols = Array.from({ length: symbolCount }, () =>
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      )
      const unique = [...new Map(symbols.map(s => [s.id, s])).values()]
      targetSymbols = [unique[0], unique[1] || SYMBOLS[0]]
      break
      
    case 'sequence':
      const start = Math.floor(Math.random() * (SYMBOLS.length - symbolCount))
      symbols = SYMBOLS.slice(start, start + symbolCount)
      targetSymbols = [SYMBOLS[start + symbolCount] || SYMBOLS[0], symbols[symbols.length - 1]]
      break
      
    case 'group':
      const groupSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      symbols = Array.from({ length: symbolCount }, (_, i) =>
        i < symbolCount / 2 ? groupSymbol : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      )
      targetSymbols = [groupSymbol, SYMBOLS.find(s => s.id !== groupSymbol.id)]
      break
  }
  
  const answer = pattern === 'same' ? 0 : pattern === 'different' ? 1 : pattern === 'sequence' ? 0 : 0
  
  return {
    symbols,
    targetSymbols,
    answer,
    pattern
  }
}

function App() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState('instruction') // 'instruction', 'playing'
  const [currentMatch, setCurrentMatch] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'instruction') {
      const match = generateMatch(level)
      setCurrentMatch(match)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowNext(false)
    }
  }, [level, gameState])

  const handleStart = () => {
    setGameState('playing')
  }

  const handleSelect = (index) => {
    if (showNext) return
    setSelectedAnswer(index)
    const correct = index === currentMatch.answer
    setIsCorrect(correct)
    
    if (correct) {
      setScore(prev => prev + 10)
    }
    setShowNext(true)
  }

  const handleNext = () => {
    if (isCorrect) {
      setLevel(prev => prev + 1)
    }
    setGameState('instruction')
  }

  const handleRestart = () => {
    if (score > 0) {
      saveScore('symbol-matching', score, level)
    }
    setLevel(1)
    setScore(0)
    setGameState('instruction')
  }

  const goHome = () => {
    if (score > 0) {
      saveScore('symbol-matching', score, level)
    }
    window.location.href = '/'
  }

  if (!currentMatch) return null

  // Fill 3×6 grid (18 tiles) by repeating the sequence
  const GRID_ROWS = 3
  const GRID_COLS = 6
  const gridSize = GRID_ROWS * GRID_COLS
  const gridSymbols = Array.from({ length: gridSize }, (_, i) =>
    currentMatch.symbols[i % currentMatch.symbols.length]
  )

  return (
    <div className="app app--symbol-matching">
      <button className="home-button" onClick={goHome} aria-label="Home">Home</button>

      <header className="symbol-header">
        <div className="symbol-header__pill">Balance: {score}</div>
        <h1 className="symbol-header__title">Symbol Matching</h1>
        <div className="symbol-header__pill">Level {level}</div>
      </header>

      <div className="game-container">
        {gameState === 'instruction' && (
          <InstructionScreen
            title="Match the Pattern"
            description="Match symbols according to the rule shown."
            hints={[
              "Look at the sequence of symbols carefully.",
              "Identify the pattern connecting them.",
              "Select the symbol that completes the pattern!",
            ]}
            onStart={handleStart}
          />
        )}

        {gameState === 'playing' && (
          <>
            <div className="symbol-grid-wrap">
              {[0, 1, 2].map((rowIndex) => (
                <div key={rowIndex} className="symbol-grid-row">
                  <div className="symbol-grid-row__line" aria-hidden="true" />
                  <div className="symbol-grid-row__tiles">
                    {gridSymbols.slice(rowIndex * GRID_COLS, (rowIndex + 1) * GRID_COLS).map((symbol, colIndex) => (
                      <div key={`${rowIndex}-${colIndex}`} className="symbol-tile-cell">
                        <div className={`symbol-tile symbol-tile--${symbol.border}`}>
                          <div className="symbol-tile__icon">{symbol.icon}</div>
                        </div>
                        <div className="symbol-tile__value">{symbol.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="options-section">
              <p className="options-section__prompt">Which symbol completes the pattern?</p>
              <div className="options-grid">
                {currentMatch.targetSymbols.map((symbol, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`option-button option-button--${symbol.border} ${
                      selectedAnswer === index
                        ? isCorrect
                          ? 'option-button--correct'
                          : 'option-button--incorrect'
                        : ''
                    } ${showNext && index === currentMatch.answer ? 'option-button--show-answer' : ''}`}
                    onClick={() => handleSelect(index)}
                    disabled={showNext}
                  >
                    <span className="option-button__icon">{symbol.icon}</span>
                    <span className="option-button__value">{symbol.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {showNext && (
              <div className="feedback-section">
                {isCorrect ? (
                  <p className="feedback feedback--correct">Correct! +10 points</p>
                ) : (
                  <p className="feedback feedback--incorrect">
                    Incorrect. The answer was{' '}
                    <span className="feedback-symbol">
                      <span className="feedback-symbol__icon">{currentMatch.targetSymbols[currentMatch.answer].icon}</span>
                      <span className="feedback-symbol__value">{currentMatch.targetSymbols[currentMatch.answer].value}</span>
                    </span>
                  </p>
                )}
                <button type="button" className="next-button" onClick={handleNext}>
                  {isCorrect ? 'Next Level' : 'Try Again'}
                </button>
              </div>
            )}

            {showNext && (
              <div className="actions">
                <button type="button" className="restart-button" onClick={handleRestart}>
                  Restart Game
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
