import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
// Theme: Swap between theme-neon.css and theme-retro.css (future) for A/B testing
import './styles/theme-neon.css'
// import './styles/theme-retro.css'  // Future theme option
import './styles/game-structure.css'
// App.css must load LAST to override base styles
import './App.css'

// Generate pattern based on level
function generatePattern(level) {
  const patternTypes = ['arithmetic', 'geometric', 'fibonacci', 'alternating']
  const type = patternTypes[Math.floor(Math.random() * patternTypes.length)]
  const length = Math.min(5 + Math.floor(level / 2), 8)
  const missingIndex = Math.floor(Math.random() * (length - 2)) + 1 // Not first or last
  
  let pattern = []
  let answer = null
  
  switch (type) {
    case 'arithmetic':
      const diff = Math.floor(Math.random() * 5) + 1
      const start = Math.floor(Math.random() * 10) + 1
      pattern = Array.from({ length: length }, (_, i) => start + i * diff)
      answer = pattern[missingIndex]
      break
      
    case 'geometric':
      const ratio = Math.floor(Math.random() * 3) + 2
      const gStart = Math.floor(Math.random() * 5) + 1
      pattern = Array.from({ length: length }, (_, i) => gStart * Math.pow(ratio, i))
      answer = pattern[missingIndex]
      break
      
    case 'fibonacci':
      pattern = [1, 1]
      for (let i = 2; i < length; i++) {
        pattern.push(pattern[i - 1] + pattern[i - 2])
      }
      answer = pattern[missingIndex]
      break
      
    case 'alternating':
      const altStart = Math.floor(Math.random() * 10) + 1
      const altDiff = Math.floor(Math.random() * 5) + 1
      pattern = Array.from({ length: length }, (_, i) => 
        i % 2 === 0 ? altStart + i * altDiff : altStart + (i - 1) * altDiff - altDiff
      )
      answer = pattern[missingIndex]
      break
  }
  
  // Generate wrong options
  const options = [answer]
  while (options.length < 4) {
    const wrong = answer + (Math.floor(Math.random() * 20) - 10)
    if (wrong > 0 && !options.includes(wrong)) {
      options.push(wrong)
    }
  }
  
  return {
    pattern,
    missingIndex,
    answer,
    options: options.sort(() => Math.random() - 0.5),
    type
  }
}

function App() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState('instruction') // 'instruction', 'playing', 'results'
  const [currentPattern, setCurrentPattern] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showNext, setShowNext] = useState(false)
  const [patternKey, setPatternKey] = useState(0) // Force pattern regeneration
  const [timeLeft, setTimeLeft] = useState(30) // 30 second timer per round

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'instruction') {
      const pattern = generatePattern(level)
      setCurrentPattern(pattern)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowNext(false)
      setTimeLeft(30) // Reset timer for each round
    }
  }, [level, gameState, patternKey]) // patternKey ensures pattern changes even when level doesn't

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && !showNext && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && gameState === 'playing' && !showNext) {
      // Time's up - treat as wrong answer
      setShowNext(true)
      setIsCorrect(false)
    }
  }, [gameState, showNext, timeLeft])

  const handleStart = () => {
    setTimeLeft(30)
    setGameState('playing')
  }

  const handleAnswerSelect = (answer) => {
    if (showNext) return
    setSelectedAnswer(answer)
    const correct = answer === currentPattern.answer
    setIsCorrect(correct)
    
    if (correct) {
      setScore(prev => prev + 10)
      setShowNext(true)
    } else {
      setShowNext(true)
    }
  }

  const handleNext = () => {
    // Capture isCorrect value before state reset
    const wasCorrect = isCorrect
    // Force pattern regeneration by incrementing patternKey
    setPatternKey(prev => prev + 1)
    
    if (wasCorrect) {
      // Check if completed all levels
      if (level >= 10) {
        // Save score when completing the game
        saveScore('pattern-completion', score + 10, 10) // +10 for final correct answer
        setGameState('completed')
      } else {
        // Move to next level, skip instructions
        setLevel(prev => prev + 1)
        setGameState('playing')
      }
    } else {
      // Wrong answer - retry same level
      setGameState('playing')
    }
  }

  const handleRestart = () => {
    if (score > 0 && gameState !== 'completed') {
      saveScore('pattern-completion', score, level)
    }
    setLevel(1)
    setScore(0)
    setPatternKey(0)
    setGameState('instruction')
  }

  const goHome = () => {
    if (score > 0) {
      saveScore('pattern-completion', score, level)
    }
    window.location.href = '/'
  }

  if (!currentPattern) return null

  return (
    <div className="app">
      <button className="home-button" onClick={goHome}>Home</button>
      
      <h1>Pattern Completion</h1>
      
      <div className="game-info">
        <div className="level-badge">Level {level}</div>
        <div className="score-badge">Score: {score}</div>
      </div>

      <div className="game-container">
        {gameState === 'instruction' && (
          <InstructionScreen
            title="Complete the Pattern"
            description="Find the missing number that completes the sequence. Look for the pattern!"
            hints={[
              'Look for the rule that connects the numbers.',
              'It could be adding, multiplying, or another pattern.',
              'Select the correct answer from the options!',
            ]}
            onStart={handleStart}
          />
        )}

        {gameState === 'playing' && (
          <>
            <div className="game-info-badges">
              <div className="level-badge">Level {level}</div>
              <div className={`timer-badge ${timeLeft <= 10 ? 'warning' : ''}`}>{timeLeft}s</div>
              <div className="score-badge">Score: {score}</div>
            </div>

            <div className="pattern-section">
              <h2>Complete the Pattern</h2>
              <div className="pattern-display">
                {currentPattern.pattern.map((num, index) => (
                  <div
                    key={index}
                    className={`pattern-item ${index === currentPattern.missingIndex ? 'missing' : ''}`}
                  >
                    {index === currentPattern.missingIndex ? '?' : num}
                  </div>
                ))}
              </div>
            </div>

            <div className="options-section">
              <h3>Select the missing number:</h3>
              <div className="options-grid">
                {currentPattern.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${
                      selectedAnswer === option
                        ? isCorrect
                          ? 'correct'
                          : 'incorrect'
                        : ''
                    } ${showNext && option === currentPattern.answer ? 'show-answer' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showNext}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {showNext && (
              <div className={`feedback-section ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <>
                    <span className="feedback-icon" aria-hidden>✓</span>
                    <p className="feedback-label">Correct!</p>
                    <p className="feedback-detail">+10 points</p>
                  </>
                ) : (
                  <>
                    <span className="feedback-icon" aria-hidden>✗</span>
                    <p className="feedback-label">Incorrect</p>
                    <p className="feedback-detail">The answer was <strong>{currentPattern.answer}</strong></p>
                  </>
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

        {gameState === 'completed' && (
          <div className="completed-phase">
            <h2 className="congrats-title">Congratulations!</h2>
            <div className="congrats-box">
              <p className="congrats-message">You completed all 10 levels!</p>
              <div className="final-score">
                <span className="final-score-label">Final Score</span>
                <span className="final-score-value">{score}</span>
              </div>
            </div>
            <button className="start-button" onClick={handleRestart}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
