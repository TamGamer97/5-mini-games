import '../styles/instruction-screen.css'

function InstructionScreen({
  heading = 'Instructions',
  title,
  description,
  hints = [],
  onStart,
  startLabel = 'Start Round',
}) {
  return (
    <div className="instruction-phase">
      <h2>{heading}</h2>
      <div className="instruction-box">
        {title ? <h3 className="rule-name">{title}</h3> : null}
        {description ? <p className="rule-description">{description}</p> : null}
        {hints.length > 0 ? (
          <div className="instruction-hint">
            {hints.map((hint, index) => (
              <p key={index}>{hint}</p>
            ))}
          </div>
        ) : null}
      </div>
      <button className="start-button" onClick={onStart}>
        {startLabel}
      </button>
    </div>
  )
}

export default InstructionScreen
