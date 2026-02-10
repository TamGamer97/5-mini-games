const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const games = [
  'object-association',
  'pattern-completion',
  'quantitative-recall',
  'sequence-recall',
  'symbol-matching'
]

// Build each game
for (const name of games) {
  const cwd = path.join(root, name)
  console.log(`Building ${name}...`)
  execSync('npm ci', { cwd, stdio: 'inherit' })
  execSync('npm run build', { cwd, stdio: 'inherit' })
}

// Create output directory
const outDir = path.join(root, 'out')
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true })
}
fs.mkdirSync(outDir, { recursive: true })

// Copy root index.html
fs.copyFileSync(
  path.join(root, 'index.html'),
  path.join(outDir, 'index.html')
)

// Copy assets (images) to out/assets
const assetsSrc = path.join(root, 'assets')
const assetsDest = path.join(outDir, 'assets')
if (fs.existsSync(assetsSrc)) {
  fs.mkdirSync(assetsDest, { recursive: true })
  for (const entry of fs.readdirSync(assetsSrc, { withFileTypes: true })) {
    const srcPath = path.join(assetsSrc, entry.name)
    const destPath = path.join(assetsDest, entry.name)
    if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
  console.log('Copied assets to out/assets')
}

// Copy each game's dist into out/<game>/
function copyDirRecursive (src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

for (const name of games) {
  const src = path.join(root, name, 'dist')
  const dest = path.join(outDir, name)
  if (fs.existsSync(src)) {
    copyDirRecursive(src, dest)
    console.log(`Copied ${name} to out/${name}`)
  }
}

console.log('Build complete. Output is in ./out')
