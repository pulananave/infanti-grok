import { useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { songsByAlbum } from '../config/catalog'
import { useCatalog } from '../state/catalogStore'
import { useGame } from '../state/gameStore'
import { SongEditor } from './SongEditor'

export function SongMenu() {
  const selectSong = useGame((s) => s.selectSong)
  const albums = useCatalog((s) => s.albums)
  const songs = useCatalog((s) => s.songs)
  const [editorOpen, setEditorOpen] = useState(false)
  const groups = songsByAlbum(albums, songs)

  return (
    <div className="song-menu">
      <header className="brand song-menu-top">
        <div>
          <h1>INFANTI</h1>
          <p>Groovy Gang · palco musical</p>
        </div>
        <button type="button" className="editor-launch" onClick={() => setEditorOpen(true)}>
          Editor
        </button>
      </header>
      <p className="portrait-hint">Fica ainda melhor deitado — paisagem primeiro.</p>
      {groups.map(({ album, songs: albumSongs }) => (
        <section key={album.id} className="album-section">
          <h2 className="album-heading">{album.name}</h2>
          <div className="song-grid">
            {albumSongs.map((song) => (
              <button
                key={song.id}
                type="button"
                className="song-card"
                style={{
                  background: `linear-gradient(160deg, ${song.theme.horizon}, ${song.theme.sky})`,
                }}
                onPointerDown={() => {
                  audioEngine.unlock()
                }}
                onClick={() => {
                  audioEngine.unlock()
                  void selectSong(song.id)
                }}
              >
                <strong>{song.title}</strong>
                <span>{song.bpm} BPM</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {editorOpen && <SongEditor onClose={() => setEditorOpen(false)} />}
    </div>
  )
}
