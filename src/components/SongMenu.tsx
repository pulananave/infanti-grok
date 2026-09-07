import { SONGS } from '../config/loadConfig'
import { useGame } from '../state/gameStore'
import type { SongId } from '../types'

export function SongMenu() {
  const selectSong = useGame((s) => s.selectSong)

  return (
    <div className="song-menu">
      <header className="brand">
        <h1>INFANTI</h1>
        <p>Groovy Gang · palco musical</p>
      </header>
      <p className="portrait-hint">Fica ainda melhor deitado — paisagem primeiro.</p>
      <div className="song-grid">
        {SONGS.map((song) => (
          <button
            key={song.id}
            type="button"
            className="song-card"
            style={{
              background: `linear-gradient(160deg, ${song.theme.horizon}, ${song.theme.sky})`,
            }}
            onClick={() => {
              void selectSong(song.id as SongId)
            }}
          >
            <strong>{song.title}</strong>
            <span>{song.bpm} BPM</span>
          </button>
        ))}
      </div>
    </div>
  )
}
