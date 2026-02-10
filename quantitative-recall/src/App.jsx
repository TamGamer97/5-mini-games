import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
// Theme: Swap between theme-neon.css and theme-retro.css (future) for A/B testing
import './styles/theme-neon.css'
// import './styles/theme-retro.css'  // Future theme option
import './styles/game-structure.css'
// App.css must load LAST to override base styles
import './App.css'

function generateNumbers(level) {
  const count = Math.min(3 + Math.floor(level / 2), 6)
  const numbers = []
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * 50) + 1)
  }
  return numbers
}

function getDisplayTime(level) {
  return Math.ceil(Math.max(3, 8 - (level * 0.3)))
}

function App() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [numbers, setNumbers] = useState([])
  const [gameState, setGameState] = useState('instruction') // 'instruction', 'showing', 'hidden', 'question', 'results'
  const [timeRemaining, setTimeRemaining] = useState(8)
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState(null)
  const [showNext, setShowNext] = useState(false)
  const [questionType, setQuestionType] = useState('sum') // 'sum', 'product', 'difference'
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (gameState === 'showing' || gameState === 'instruction') {
      setIsInitializing(true)
      const newNumbers = generateNumbers(level)
      const displayTime = getDisplayTime(level)
      const types = ['sum', 'product', 'difference']
      setNumbers(newNumbers)
      setTimeRemaining(displayTime)
      setQuestionType(types[Math.floor(Math.random() * types.length)])
      setUserAnswer('')
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
    if (gameState === 'showing' && !isInitializing && numbers.length > 0 && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'showing' && !isInitializing && numbers.length > 0 && timeRemaining === 0) {
      setGameState('hidden')
      setTimeout(() => {
        setGameState('question')
      }, 1000)
    }
  }, [gameState, timeRemaining, numbers, isInitializing])

  const calculateAnswer = () => {
    switch (questionType) {
      case 'sum':
        return numbers.reduce((a, b) => a + b, 0)
      case 'product':
        return numbers.reduce((a, b) => a * b, 1)
      case 'difference':
        return numbers.reduce((a, b) => a - b)
      default:
        return 0
    }
  }

  const getQuestionText = () => {
    switch (questionType) {
      case 'sum':
        return `What is the sum of all the numbers?`
      case 'product':
        return `What is the product of all the numbers?`
      case 'difference':
        return `What is the difference (first - second - third...)?`
      default:
        return ''
    }
  }

  const handleSubmit = () => {
    const answer = parseInt(userAnswer)
    const correctAnswer = calculateAnswer()
    const correct = answer === correctAnswer
    
    setIsCorrect(correct)
    if (correct) {
      setScore(prev => prev + 10)
    }
    setShowNext(true)
    setGameState('results')
  }

  const handleNext = () => {
    if (isCorrect) {
      setLevel(prev => prev + 1)
    }
    setGameState('instruction')
  }

  const handleRestart = () => {
    if (score > 0) {
      saveScore('quantitative-recall', score, level)
    }
    setLevel(1)
    setScore(0)
    setGameState('instruction')
  }

  const goHome = () => {
    if (score > 0) {
      saveScore('quantitative-recall', score, level)
    }
    window.location.href = '/'
  }

  return (
    <div className="app">
      <button className="home-button" onClick={goHome}>Home</button>
      
      <h1>Quantitative Recall</h1>
      
      <div className="game-info">
        <div className="level-badge">Level {level}</div>
        <div className="score-badge">Score: {score}</div>
      </div>

      <div className="game-container">
        {gameState === 'instruction' && (
          <InstructionScreen
            title="Number Memory"
            description="Remember the numbers and answer questions about them."
            hints={[
              "You'll see a set of numbers briefly.",
              "Then you'll be asked to calculate their sum, product, or difference.",
              "Type your answer and press Submit!",
            ]}
            onStart={handleStart}
          />
        )}

        {gameState === 'showing' && (
          <div className="showing-phase">
            <h2>Remember These Numbers</h2>
            <div className="timer-display">
              <div className="timer-circle">{timeRemaining}</div>
            </div>
            <div className="numbers-display">
              {numbers.map((num, index) => (
                <div key={index} className="number-item">
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'hidden' && (
          <div className="hidden-phase">
            <h2>Numbers Hidden</h2>
            <p>Get ready for the question...</p>
          </div>
        )}

        {gameState === 'question' && (
          <div className="question-phase">
            <h2>{getQuestionText()}</h2>
            <div className="input-section">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer"
                className="answer-input"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button className="submit-button" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}

        {gameState === 'results' && showNext && (
          <div className="results-phase">
            <h2>Results</h2>
            {isCorrect ? (
              <p className="feedback correct">✓ Correct! The answer was {calculateAnswer()}. +10 points</p>
            ) : (
              <p className="feedback incorrect">
                ✗ Incorrect. The answer was {calculateAnswer()}. You answered {userAnswer}.
              </p>
            )}
            <div className="numbers-display">
              {numbers.map((num, index) => (
                <div key={index} className="number-item">
                  {num}
                </div>
              ))}
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
