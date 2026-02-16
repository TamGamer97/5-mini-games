import { useState, useEffect } from 'react'
import { saveScore } from './utils/scoreManager'
import InstructionScreen from '@shared/components/InstructionScreen'
// Theme: Swap between theme-neon.css and theme-retro.css (future) for A/B testing
import './styles/theme-neon.css'
// import './styles/theme-retro.css'  // Future theme option
import './styles/game-structure.css'
// App.css must load LAST to override base styles
import './App.css'

/* -----------------------------------------------------------------------------
   OBJECT PAIRS – which items are associated (e.g. Key ↔ Lock).
   Object names here are used as labels when no image is set in OBJECT_IMAGES.
   ----------------------------------------------------------------------------- */
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

/* -----------------------------------------------------------------------------
   OBJECT IMAGES – optional image URLs per object.
   - Keys must match object names used in OBJECT_PAIRS (e.g. 'Key', 'Lock').
   - image: shown when the card is NOT selected (default state).
   - imageSelected: shown when the card IS selected or matched (active state).
   - If you omit an object or leave both URLs empty, the object name is shown as text.
   Example:
     Key: {
       image: '/images/key.png',
       imageSelected: '/images/key-selected.png'
     },
   ----------------------------------------------------------------------------- */
const OBJECT_IMAGES = {
  // Key: { image: '/path/to/key.png', imageSelected: '/path/to/key-selected.png' },
  // Lock: { image: '/path/to/lock.png', imageSelected: '/path/to/lock-selected.png' },
  // Add more entries for Pen, Paper, Shoe, Sock, etc. as needed.
}

/**
 * Returns the image URL to show for an object, or null if it should render as text.
 * @param {string} objectName - e.g. 'Key', 'Lock'
 * @param {boolean} isActive - true when selected or matched
 */
function getObjectImage(objectName, isActive) {
  const config = OBJECT_IMAGES[objectName]
  if (!config) return null
  const url = isActive && config.imageSelected ? config.imageSelected : config.image
  return url || null
}

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

  const pairsRemaining = gameState === 'matching' ? pairs.length - matchedPairs.length : pairs.length

  return (
    <div className="app object-association-design">
      <button className="home-button" onClick={goHome} aria-label="Home">
        Home
      </button>

      {gameState === 'matching' && (
        <header className="game-header">
          <span className="header-balance">Balance: {score}</span>
          <div className="header-right">
            <span className="header-session">Session {level}</span>
            <span className="header-pairs">{pairsRemaining} Pairs Remaining</span>
          </div>
        </header>
      )}

      {gameState !== 'matching' && (
        <>
          <h1 className="game-title">Object Association</h1>
          <div className="game-info">
            <span className="level-badge">Level {level}</span>
            <span className="score-badge">Score: {score}</span>
          </div>
        </>
      )}

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
                  <span className="object object--display">
                    {getObjectImage(pair.object1, false) ? (
                      <img src={getObjectImage(pair.object1, false)} alt={pair.object1} className="object-img" />
                    ) : (
                      pair.object1
                    )}
                  </span>
                  <span className="connector">→</span>
                  <span className="object object--display">
                    {getObjectImage(pair.object2, false) ? (
                      <img src={getObjectImage(pair.object2, false)} alt={pair.object2} className="object-img" />
                    ) : (
                      pair.object2
                    )}
                  </span>
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
            <div className="objects-grid">
              {matchingOrder.map((object, index) => {
                const isMatched = pairs.some(p =>
                  (p.object1 === object || p.object2 === object) &&
                  matchedPairs.includes(p.object1)
                )
                const isSelected = selectedObject === object
                const isActive = isSelected || isMatched
                const imageUrl = getObjectImage(object, isActive)
                return (
                  <button
                    key={`object-${index}`}
                    type="button"
                    className={`object-card ${isActive ? 'object-card--active' : ''}`}
                    onClick={() => handleObjectClick(object)}
                    disabled={isMatched || showNext}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt={object} className="object-card__img" />
                    ) : (
                      object
                    )}
                  </button>
                )
              })}
            </div>
            {showNext && (
              <>
                <button type="button" className="next-button" onClick={handleNext}>
                  Next Level
                </button>
                <div className="actions">
                  <button type="button" className="reset-button" onClick={handleRestart}>
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
