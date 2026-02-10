export const saveScore = (gameId, score, level = null) => {
  const scores = getScores()
  const gameScores = scores[gameId] || []
  
  const newScore = {
    score,
    level,
    date: new Date().toISOString(),
    timestamp: Date.now()
  }
  
  gameScores.push(newScore)
  // Keep only top 10 scores per game
  gameScores.sort((a, b) => b.score - a.score)
  scores[gameId] = gameScores.slice(0, 10)
  
  localStorage.setItem('gameScores', JSON.stringify(scores))
}

export const getScores = () => {
  const stored = localStorage.getItem('gameScores')
  return stored ? JSON.parse(stored) : {}
}

export const getHighScore = (gameId) => {
  const scores = getScores()
  const gameScores = scores[gameId] || []
  return gameScores.length > 0 ? gameScores[0].score : 0
}

export const getBestLevel = (gameId) => {
  const scores = getScores()
  const gameScores = scores[gameId] || []
  const withLevel = gameScores.filter(s => s.level !== null)
  if (withLevel.length === 0) return null
  return Math.max(...withLevel.map(s => s.level))
}
