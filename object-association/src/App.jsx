import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
// Theme: Swap between theme-neon.css and theme-retro.css (future) for A/B testing
import './styles/theme-neon.css'
// import './styles/theme-retro.css'  // Future theme option
import './styles/game-structure.css'
// App.css must load LAST to override base styles
import './App.css'

const OBJECT_PAIRS = [
  { object1: 'Key', object2: 'Lock' },
  { object1: 'Pen', object2: 'Paper' },
  { object1: 'Shoe', object2: 'Sock' },
  { object1: 'Phone', object2: 'Charger' },
  { object1: 'Book', object2: 'Bookmark' },
  { object1: 'Cup', object2: 'Saucer' },
  { object1: 'Toothbrush', object2: 'Toothpaste' },
  { object1: 'Glasses', object2: 'Case' },
  { object1: 'Remote', object2: 'TV' },
  { object1: 'Umbrella', object2: 'Rain' }
]

const MATCH_COLOURS = ['purple', 'blue', 'green', 'orange', 'red']

function pickRandomUnusedColour(usedPairColours) {
  const used = Object.values(usedPairColours)
  const available = MATCH_COLOURS.filter(c => !used.includes(c))
  if (available.length === 0) return MATCH_COLOURS[0]
  return available[Math.floor(Math.random() * available.length)]
}

function generatePairs(level) {
  const pairCount = Math.min(3 + Math.floor(level / 2), 5)
  const shuffled = [...OBJECT_PAIRS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, pairCount)
}

function getDisplayTime(level) {
  return Math.ceil(Math.max(3, 8 - (level * 0.3)))
}

function App() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [pairs, setPairs] = useState([])
  const [gameState, setGameState] = useState('instruction') // 'instruction', 'showing', 'hidden', 'matching', 'results'
  const [timeRemaining, setTimeRemaining] = useState(8)
  const [selectedObject, setSelectedObject] = useState(null)
  const [selectedColour, setSelectedColour] = useState(null)
  const [pairColours, setPairColours] = useState({})
  const [matchingOrder, setMatchingOrder] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [showNext, setShowNext] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (gameState === 'showing' || gameState === 'instruction') {
      setIsInitializing(true)
      const newPairs = generatePairs(level)
      const displayTime = getDisplayTime(level)
      setPairs(newPairs)
      setTimeRemaining(displayTime)
      setMatchedPairs([])
      setSelectedObject(null)
      setSelectedColour(null)
      setPairColours({})
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
    if (gameState === 'showing' && !isInitializing && pairs.length > 0 && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'showing' && !isInitializing && pairs.length > 0 && timeRemaining === 0) {
      setGameState('hidden')
      setTimeout(() => {
        const flat = pairs.flatMap(p => [p.object1, p.object2])
        setMatchingOrder([...flat].sort(() => Math.random() - 0.5))
        setGameState('matching')
      }, 1000)
    }
  }, [gameState, timeRemaining, pairs, isInitializing])

  function getObjectColour(object) {
    const pair = pairs.find(p => (p.object1 === object || p.object2 === object) && matchedPairs.includes(p.object1))
    if (pair && pairColours[pair.object1]) return pairColours[pair.object1]
    if (object === selectedObject && selectedColour) return selectedColour
    return 'default'
  }

  const handleObjectClick = (object) => {
    if (gameState !== 'matching' || showNext) return
    if (selectedObject === null) {
      setSelectedObject(object)
      setSelectedColour(pickRandomUnusedColour(pairColours))
    } else {
      const pair = pairs.find(p =>
        (p.object1 === selectedObject && p.object2 === object) ||
        (p.object1 === object && p.object2 === selectedObject)
      )
      if (pair && !matchedPairs.includes(pair.object1)) {
        setPairColours(prev => ({ ...prev, [pair.object1]: selectedColour }))
        setMatchedPairs(prev => [...prev, pair.object1])
        setScore(prev => prev + 10)
        if (matchedPairs.length + 1 === pairs.length) setShowNext(true)
      }
      setSelectedObject(null)
      setSelectedColour(null)
    }
  }

  const handleNext = () => {
    if (matchedPairs.length === pairs.length) {
      setLevel(prev => prev + 1)
    }
    setGameState('instruction')
  }

  const handleRestart = () => {
    if (score > 0) {
      saveScore('object-association', score, level)
    }
    setLevel(1)
    setScore(0)
    setGameState('instruction')
  }

  const goHome = () => {
    if (score > 0) {
      saveScore('object-association', score, level)
    }
    window.location.href = '/'
  }

  return (
    <div className="app">
      <button className="home-button" onClick={goHome}>
        Home
      </button>
      
      <h1>Object Association</h1>
      
      <div className="game-info">
        <div className="level-badge">Level {level}</div>
        <div className="score-badge">Score: {score}</div>
      </div>

      <div className="game-container">
        {gameState === 'instruction' && (
          <InstructionScreen
            title="Remember the Pairs"
            description="Remember which objects are paired together."
            hints={[
              "You'll see pairs of associated objects briefly.",
              "After they disappear, match the objects that belong together.",
              "Click two objects to match them!",
            ]}
            onStart={handleStart}
          />
        )}

        {gameState === 'showing' && (
          <div className="showing-phase">
            <h2>Remember the Associations</h2>
            <div className="timer-display">
              <div className="timer-circle">{timeRemaining}</div>
            </div>
            <div className="pairs-display">
              {pairs.map((pair, index) => (
                <div key={index} className="pair-item">
                  <span className="object">{pair.object1}</span>
                  <span className="connector">→</span>
                  <span className="object">{pair.object2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'hidden' && (
          <div className="hidden-phase">
            <h2>Associations Hidden</h2>
            <p>Get ready to match...</p>
          </div>
        )}

        {gameState === 'matching' && (
          <div className="matching-phase">
            <h2>Match the Associated Objects</h2>
            <div className="matching-instructions">
              <p>Click on objects that go together</p>
              <p>Matched: {matchedPairs.length} / {pairs.length}</p>
            </div>
            <div className="objects-grid">
              {matchingOrder.map((object, index) => {
                const isMatched = pairs.some(p =>
                  (p.object1 === object || p.object2 === object) &&
                  matchedPairs.includes(p.object1)
                )
                const isSelected = selectedObject === object
                const colour = getObjectColour(object)
                return (
                  <button
                    key={object}
                    className={`object-button object-button-${colour} ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}
                    onClick={() => handleObjectClick(object)}
                    disabled={isMatched || showNext}
                  >
                    {object}
                  </button>
                )
              })}
            </div>
            {showNext && (
              <button className="next-button" onClick={handleNext}>
                Next Level
              </button>
            )}
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
