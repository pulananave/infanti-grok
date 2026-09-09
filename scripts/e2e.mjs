import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const require = createRequire(import.meta.url)

let puppeteer
try {
  puppeteer = require('puppeteer-core')
} catch {
  const install = spawn('npm', ['install', '--no-save', 'puppeteer-core@24.15.0'], {
    stdio: 'inherit',
  })
  await new Promise((resolve, reject) => {
    install.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('install failed'))))
  })
  puppeteer = require('puppeteer-core')
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=900,500',
    '--autoplay-policy=no-user-gesture-required',
  ],
  defaultViewport: { width: 900, height: 500, isMobile: true, hasTouch: true },
})

const page = await browser.newPage()
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))

await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle0' })
await page.waitForSelector('.song-card')

const songs = await page.$$eval('.song-card', (cards) =>
  cards.map((card) => ({
    title: card.querySelector('strong')?.textContent,
    bpm: card.querySelector('span')?.textContent,
  })),
)

if (songs.length !== 5) throw new Error(`expected 5 songs, got ${songs.length}`)
if (songs[0].title !== 'Dona Aranha') throw new Error(songs[0].title)
if (!songs[0].bpm.includes('114')) throw new Error(`bad bpm: ${songs[0].bpm}`)

await page.click('.song-card')
await page.waitForSelector('.tray-slot')
await sleep(400)

const slotCount = await page.$$eval('.tray-slot', (els) => els.length)
if (slotCount !== 9) throw new Error(`expected 9 tray characters, got ${slotCount}`)

const slots = await page.$$('.tray-slot')
await slots[0].click()
await page.waitForSelector('.instrument-btn')

const icon = await page.$('.instrument-btn')
const iconBox = await icon.boundingBox()
const canvas = await page.$('canvas')
const canvasBox = await canvas.boundingBox()
if (!iconBox || !canvasBox) throw new Error('missing boxes')

const dropX = canvasBox.x + canvasBox.width * 0.5
const dropY = canvasBox.y + canvasBox.height * 0.42
await page.mouse.move(iconBox.x + iconBox.width / 2, iconBox.y + iconBox.height / 2)
await page.mouse.down()
await page.mouse.move(dropX, dropY, {
  steps: 16,
})
await page.mouse.up()
await sleep(500)

const afterSpawn = await page.evaluate(() => window.__infanti.getState().instances.length)
if (afterSpawn !== 1) throw new Error(`spawn failed, instances=${afterSpawn}`)

const missX = canvasBox.x + canvasBox.width * 0.82
const missY = canvasBox.y + canvasBox.height * 0.28
const missHit = await page.evaluate((x, y) => window.__infanti.pickInstanceAt(x, y), missX, missY)
if (missHit) throw new Error(`empty space hit character: ${missHit}`)

const nearMiss = await page.evaluate(() => {
  const instance = window.__infanti.getState().instances[0]
  const [x, , z] = instance.position
  const screen = window.__infanti.instanceScreenPoint([x, 0, z + 1.15], 0.02)
  if (!screen) return { hit: 'no-screen' }
  return { hit: window.__infanti.pickInstanceAt(screen.x, screen.y), screen }
})
if (nearMiss.hit) throw new Error(`old oversized radius still hits: ${JSON.stringify(nearMiss)}`)

await page.mouse.move(missX, missY)
await page.mouse.down()
await sleep(60)
const missDrag = await page.evaluate(() => window.__infanti.getState().drag)
await page.mouse.up()
if (missDrag) throw new Error(`empty-space click started drag: ${JSON.stringify(missDrag)}`)

const skin = await page.evaluate(() => {
  const instance = window.__infanti.getState().instances[0]
  return window.__infanti.instanceScreenPoint(instance.position, 0.55)
})
if (!skin) throw new Error('missing character screen point')
const skinHit = await page.evaluate((x, y) => window.__infanti.pickInstanceAt(x, y), skin.x, skin.y)
if (!skinHit) throw new Error(`skin click missed character at ${JSON.stringify(skin)}`)

const debugHit = await page.evaluate((x, y) => {
  const state = window.__infanti.getState()
  const el = document.elementFromPoint(x, y)
  return {
    instances: state.instances,
    tag: el?.tagName,
    className: el?.className,
    id: el?.id,
  }
}, skin.x, skin.y)
console.log('debug after spawn', JSON.stringify(debugHit), { skin, missHit })

const trayBox = await page.$eval('[data-tray]', (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, height: r.height }
})

await page.mouse.move(skin.x, skin.y)
await page.mouse.down()
await sleep(80)
const duringDown = await page.evaluate(() => window.__infanti.getState().drag)
console.log('during down', duringDown)
await page.mouse.move(trayBox.x, trayBox.y, { steps: 24 })
const duringMove = await page.evaluate(() => window.__infanti.getState().drag)
console.log('during move', duringMove, 'tray', trayBox)
await page.mouse.up()
await sleep(200)
const afterUp = await page.evaluate(() => {
  const state = window.__infanti.getState()
  return { count: state.instances.length, drag: state.drag, lastInteractAt: state.lastInteractAt }
})
console.log('after up', afterUp)

if (afterUp.count !== 0) {
  throw new Error(`remove failed: ${JSON.stringify(afterUp)}`)
}

await sleep(200)
const balloonOpen = await page.$('.instrument-btn')
if (!balloonOpen) {
  await page.click('[data-tray-char="boogar"]')
  await page.waitForSelector('.instrument-btn')
}
const restored = await page.$$eval('.instrument-btn', (els) => els.length)
if (restored < 2) throw new Error(`instrument did not return to balloon: ${restored}`)

const combo = await page.evaluate(async () => {
  const api = window.__infanti.getState()
  const pairs = [
    ['ceval', 'pop_bateria'],
    ['dan', 'pop_baixo'],
    ['grompy', 'pop_gtr_base'],
    ['teewong', 'pop_piano'],
  ]
  let x = -1.6
  for (const [characterId, instrument] of pairs) {
    await api.placeStem(characterId, instrument, [x, 0, 0.2])
    x += 1.1
  }
  const state = window.__infanti.getState()
  return {
    instances: state.instances.map((item) => item.instrument),
    prize: state.prize,
    awarded: state.awarded,
  }
})

if (!combo.prize || combo.prize.shape !== 'circle') {
  throw new Error(`prize missing: ${JSON.stringify(combo)}`)
}

await browser.close()

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('e2e ok', { songs, slotCount, restored, combo })
