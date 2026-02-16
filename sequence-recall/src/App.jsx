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
  const [incorrectCount, setIncorrectCount] = useState(0)

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
    } else {
      setIncorrectCount(prev => prev + 1)
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
    setIncorrectCount(0)
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

  const showSessionHeader = ['showing', 'hidden', 'recall', 'results'].includes(gameState)

  return (
    <div className="app app--soft">
      <div className="grain-overlay" aria-hidden="true" />
      <button className="home-button" onClick={goHome} aria-label="Home">Home</button>

      {showSessionHeader && (
        <div className="session-header">
          <div className="session-header__line">Session {level}</div>
          <div className="session-header__line">{incorrectCount} Incorrect</div>
        </div>
      )}

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
            <div className="central-display central-display--recessed">
              <div className="central-display__inner central-display__inner--timer-only">
                <span className="central-display__timer-number">{timeRemaining}</span>
              </div>
              <p className="central-display__instruction">Remember the Sequence</p>
            </div>
            <div className="sequence-display-boxes" aria-label="Sequence to remember">
              {currentSequence.sequence.map((item, index) => (
                <div key={index} className="sequence-display-box">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'hidden' && (
          <div className="hidden-phase">
            <div className="central-display central-display--recessed">
              <div className="central-display__inner">
                <span className="central-display__placeholder">—</span>
              </div>
              <p className="central-display__instruction">Get ready to recall…</p>
            </div>
          </div>
        )}

        {gameState === 'recall' && (
          <div className="recall-phase">
            <div className={`central-display central-display--recessed${userSequence.length > 0 ? ' central-display--expandable' : ''}`}>
              <div className="central-display__inner">
                {userSequence.length > 0 ? (
                  <div className="sequence-display sequence-display--in-frame">
                    {userSequence.map((item, index) => (
                      <span key={index} className={`sequence-item sequence-item--in-frame ${currentSequence.type}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="central-display__placeholder">?</span>
                )}
              </div>
              <p className="central-display__instruction">
                {currentSequence.type === 'numbers' ? 'Recall the Number' : 'Recreate the sequence'}
              </p>
            </div>
            <div className="choice-buttons">
              {availableItems.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className="choice-button"
                  onClick={() => handleItemClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="recall-actions">
              <button type="button" className="soft-button" onClick={handleClear}>
                Clear
              </button>
              <button type="button" className="soft-button soft-button--primary" onClick={handleSubmit} disabled={userSequence.length === 0}>
                Submit
              </button>
            </div>
          </div>
        )}

        {gameState === 'results' && showNext && (
          <div className="results-phase">
            <div className="central-display central-display--recessed">
              <div className="central-display__inner">
                {isCorrect ? (
                  <span className="central-display__result central-display__result--correct">Correct</span>
                ) : (
                  <span className="central-display__result central-display__result--incorrect">Incorrect</span>
                )}
              </div>
              <p className="central-display__instruction">
                {isCorrect ? `+10 points · Score: ${score}` : 'Try again'}
              </p>
            </div>
            <div className="comparison">
              <div className="sequence-comparison">
                <p>Correct:</p>
                <div className="sequence-display sequence-display--small">
                  {currentSequence.sequence.map((item, index) => (
                    <span key={index} className={`sequence-item sequence-item--small ${currentSequence.type}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sequence-comparison">
                <p>Yours:</p>
                <div className="sequence-display sequence-display--small">
                  {userSequence.map((item, index) => {
                    const ok = item === currentSequence.sequence[index]
                    return (
                      <span key={index} className={`sequence-item sequence-item--small ${currentSequence.type} ${ok ? 'correct' : 'incorrect'}`}>
                        {item}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <button type="button" className="soft-button soft-button--primary" onClick={handleNext}>
              {isCorrect ? 'Next Level' : 'Try Again'}
            </button>
            <button type="button" className="soft-button soft-button--reset" onClick={handleRestart}>
              Reset
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
