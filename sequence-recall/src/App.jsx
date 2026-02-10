import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
// Theme: Swap between theme-neon.css and theme-retro.css (future) for A/B testing
import './styles/theme-neon.css'
// import './styles/theme-retro.css'  // Future theme option
import './styles/game-structure.css'
// App.css must load LAST to override base styles
import './App.css'

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']
const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1)
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function generateSequence(level) {
  const type = Math.random() < 0.33 ? 'colors' : Math.random() < 0.66 ? 'numbers' : 'letters'
  const length = Math.min(4 + Math.floor(level / 2), 8)
  
  let sequence = []
  switch (type) {
    case 'colors':
      sequence = Array.from({ length: length }, () => 
        COLORS[Math.floor(Math.random() * COLORS.length)]
      )
      break
    case 'numbers':
      sequence = Array.from({ length: length }, () => 
        NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
      )
      break
    case 'letters':
      sequence = Array.from({ length: length }, () => 
        LETTERS[Math.floor(Math.random() * LETTERS.length)]
      )
      break
  }
  
  return { sequence, type }
}

function getDisplayTime(level) {
  return Math.ceil(Math.max(3, 8 - (level * 0.3)))
}

function App() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [currentSequence, setCurrentSequence] = useState(null)
  const [gameState, setGameState] = useState('instruction') // 'instruction', 'showing', 'hidden', 'recall', 'results'
  const [timeRemaining, setTimeRemaining] = useState(8)
  const [userSequence, setUserSequence] = useState([])
  const [isCorrect, setIsCorrect] = useState(null)
  const [showNext, setShowNext] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (gameState === 'showing' || gameState === 'instruction') {
      setIsInitializing(true)
      const seq = generateSequence(level)
      const displayTime = getDisplayTime(level)
      setCurrentSequence(seq)
      setTimeRemaining(displayTime)
      setUserSequence([])
      setIsCorrect(null)
      setShowNext(false)
      setTimeout(() => {
        setIsInitializing(false)
      }, 0)
    }
  }, [level, gameState])

  const handleStart = () => {
    setGameState('showing')
  }

  useEffect(() => {
    if (gameState === 'showing' && !isInitializing && currentSequence && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'showing' && !isInitializing && currentSequence && timeRemaining === 0) {
      setGameState('hidden')
      setTimeout(() => {
        setGameState('recall')
      }, 1000)
    }
  }, [gameState, timeRemaining, currentSequence, isInitializing])

  const handleItemClick = (item) => {
    if (gameState !== 'recall' || showNext) return
    setUserSequence(prev => [...prev, item])
  }

  const handleSubmit = () => {
    if (userSequence.length === 0) return
    
    const correct = JSON.stringify(userSequence) === JSON.stringify(currentSequence.sequence)
    setIsCorrect(correct)
    if (correct) {
      setScore(prev => prev + 10)
    }
    setShowNext(true)
    setGameState('results')
  }

  const handleClear = () => {
    setUserSequence([])
  }

  const handleNext = () => {
    if (isCorrect) {
      setLevel(prev => prev + 1)
    }
    setGameState('instruction')
  }

  const handleRestart = () => {
    if (score > 0) {
      saveScore('sequence-recall', score, level)
    }
    setLevel(1)
    setScore(0)
    setGameState('instruction')
  }

  const goHome = () => {
    if (score > 0) {
      saveScore('sequence-recall', score, level)
    }
    window.location.href = '/'
  }

  if (!currentSequence) return null

  const availableItems = currentSequence.type === 'colors' ? COLORS : 
                         currentSequence.type === 'numbers' ? NUMBERS : LETTERS

  return (
    <div className="app">
      <button className="home-button" onClick={goHome}>Home</button>
      
      <h1>Sequence Recall</h1>
      
      <div className="game-info">
        <div className="level-badge">Level {level}</div>
        <div className="score-badge">Score: {score}</div>
      </div>

      <div className="game-container">
        {gameState === 'instruction' && (
          <InstructionScreen
            title="Remember the Order"
            description="Watch the sequence and repeat it in the correct order."
            hints={[
              "You'll see a sequence of colors, numbers, or letters.",
              "After it disappears, click items to rebuild the sequence.",
              "Order matters - get the exact sequence right!",
            ]}
            onStart={handleStart}
          />
        )}

        {gameState === 'showing' && (
          <div className="showing-phase">
            <h2>Remember the Sequence</h2>
            <div className="timer-display">
              <div className="timer-circle">{timeRemaining}</div>
            </div>
            <div className="sequence-display">
              {currentSequence.sequence.map((item, index) => (
                <div key={index} className={`sequence-item ${currentSequence.type}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'hidden' && (
          <div className="hidden-phase">
            <h2>Sequence Hidden</h2>
            <p>Get ready to recall...</p>
          </div>
        )}

        {gameState === 'recall' && (
          <div className="recall-phase">
            <h2>Recreate the Sequence</h2>
            <div className="user-sequence">
              <p>Your sequence:</p>
              <div className="sequence-display">
                {userSequence.map((item, index) => (
                  <div key={index} className={`sequence-item ${currentSequence.type}`}>
                    {item}
                  </div>
                ))}
                {userSequence.length === 0 && (
                  <p className="empty-message">Click items below to build sequence</p>
                )}
              </div>
            </div>
            <div className="available-items">
              {availableItems.map((item, index) => (
                <button
                  key={index}
                  className={`item-button ${currentSequence.type}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="recall-actions">
              <button className="clear-button" onClick={handleClear}>
                Clear
              </button>
              <button className="submit-button" onClick={handleSubmit} disabled={userSequence.length === 0}>
                Submit
              </button>
            </div>
          </div>
        )}

        {gameState === 'results' && showNext && (
          <div className="results-phase">
            <h2>Results</h2>
            {isCorrect ? (
              <p className="feedback correct">✓ Correct! +10 points</p>
            ) : (
              <p className="feedback incorrect">✗ Incorrect. Try again!</p>
            )}
            <div className="comparison">
              <div className="sequence-comparison">
                <p>Correct sequence:</p>
                <div className="sequence-display">
                  {currentSequence.sequence.map((item, index) => (
                    <div key={index} className={`sequence-item ${currentSequence.type} correct`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="sequence-comparison">
                <p>Your sequence:</p>
                <div className="sequence-display">
                  {userSequence.map((item, index) => {
                    const isCorrectPos = item === currentSequence.sequence[index]
                    return (
                      <div key={index} className={`sequence-item ${currentSequence.type} ${isCorrectPos ? 'correct' : 'incorrect'}`}>
                        {item}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
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
      </div>
    </div>
  )
}

export default App
