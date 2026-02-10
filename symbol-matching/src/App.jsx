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

  return (
    <div className="app">
      <button className="home-button" onClick={goHome}>Home</button>
      
      <h1>Symbol Matching</h1>
      
      <div className="game-info">
        <div className="level-badge">Level {level}</div>
        <div className="score-badge">Score: {score}</div>
      </div>

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
        <div className="symbols-section">
          <h2>Match the Pattern</h2>
          <div className="symbols-display">
            {currentMatch.symbols.map((symbol, index) => (
              <div key={`${symbol.id}-${index}`} className={`symbol-card border-${symbol.border}`}>
                <div className="symbol-icon">{symbol.icon}</div>
                <div className="symbol-value">{symbol.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="options-section">
          <h3>Which symbol completes the pattern?</h3>
          <div className="options-grid">
            {currentMatch.targetSymbols.map((symbol, index) => (
              <button
                key={index}
                className={`option-button ${
                  selectedAnswer === index
                    ? isCorrect
                      ? 'correct'
                      : 'incorrect'
                    : ''
                } ${
                  showNext && index === currentMatch.answer ? 'show-answer' : ''
                } symbol-card border-${symbol.border}`}
                onClick={() => handleSelect(index)}
                disabled={showNext}
              >
                <div className="symbol-icon">{symbol.icon}</div>
                <div className="symbol-value">{symbol.value}</div>
              </button>
            ))}
          </div>
        </div>

        {showNext && (
          <div className="feedback-section">
            {isCorrect ? (
              <p className="feedback correct">✓ Correct! +10 points</p>
            ) : (
              <p className="feedback incorrect">
                {(() => {
                  const correctSymbol = currentMatch.targetSymbols[currentMatch.answer]
                  return (
                    <>
                      ✗ Incorrect. The answer was{' '}
                      <span className={`symbol-card inline border-${correctSymbol.border}`}>
                        <span className="symbol-icon">{correctSymbol.icon}</span>
                        <span className="symbol-value">{correctSymbol.value}</span>
                      </span>
                    </>
                  )
                })()}
              </p>
            )}
            <button className="next-button" onClick={handleNext}>
              {isCorrect ? 'Next Level' : 'Try Again'}
            </button>
          </div>
        )}

        <div className="actions">
          <button className="restart-button" onClick={handleRestart}>
            Restart Game
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default App
