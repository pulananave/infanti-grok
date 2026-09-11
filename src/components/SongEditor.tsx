import { useMemo, useState } from 'react'
import { CHARACTER_ORDER, CHARACTERS } from '../config/characters'
import { CATALOG_STORAGE_KEY, createBlankStem, emptyCombos, overlayFromCatalog } from '../config/catalog'
import { COMBO_SHAPES } from '../config/loadConfig'
import { useCatalog } from '../state/catalogStore'
import type { AlbumConfig, CharacterId, ComboShape, SongConfig, SongTheme, StemConfig } from '../types'

const THEME_FIELDS: { key: keyof SongTheme; label: string }[] = [
  { key: 'sky', label: 'Céu' },
  { key: 'horizon', label: 'Horizonte' },
  { key: 'floor', label: 'Chão' },
  { key: 'floorAccent', label: 'Chão (detalhe)' },
  { key: 'fog', label: 'Névoa' },
  { key: 'accent', label: 'Destaque' },
]

const COMBO_LABELS: Record<ComboShape, string> = {
  circle: 'Círculo',
  square: 'Quadrado',
  triangle: 'Triângulo',
}

interface SongDraft {
  song: SongConfig
  albumId: string
  combos: Record<ComboShape, string[]>
  limitRows: { character: CharacterId; limit: number }[]
}

function limitRowsFrom(song: SongConfig): { character: CharacterId; limit: number }[] {
  return Object.entries(song.instrumentUseLimit ?? {}).map(([character, limit]) => ({
    character: character as CharacterId,
    limit: Number(limit) || 1,
  }))
}

function toDraft(song: SongConfig, albumId: string, combos: Record<ComboShape, string[]>): SongDraft {
  return {
    song: {
      ...song,
      aliases: [...song.aliases],
      theme: { ...song.theme },
      stems: song.stems.map((stem) => ({ ...stem })),
      instrumentUseLimit: song.instrumentUseLimit ? { ...song.instrumentUseLimit } : undefined,
    },
    albumId,
    combos: {
      circle: [...(combos.circle ?? [])],
      square: [...(combos.square ?? [])],
      triangle: [...(combos.triangle ?? [])],
    },
    limitRows: limitRowsFrom(song),
  }
}

function applyLimits(song: SongConfig, rows: SongDraft['limitRows']): SongConfig {
  const instrumentUseLimit = Object.fromEntries(
    rows
      .filter((row) => row.character && Number(row.limit) >= 1)
      .map((row) => [row.character, Number(row.limit)]),
  ) as SongConfig['instrumentUseLimit']
  if (!instrumentUseLimit || Object.keys(instrumentUseLimit).length === 0) {
    const rest = { ...song }
    delete rest.instrumentUseLimit
    return rest
  }
  return { ...song, instrumentUseLimit }
}

function padCombo(values: string[] | undefined): string[] {
  const next = [...(values ?? [])]
  while (next.length < 4) next.push('')
  return next.slice(0, 4)
}

export function SongEditor({ onClose }: { onClose: () => void }) {
  const albums = useCatalog((s) => s.albums)
  const songs = useCatalog((s) => s.songs)
  const upsertSong = useCatalog((s) => s.upsertSong)
  const deleteSong = useCatalog((s) => s.deleteSong)
  const duplicateSongInto = useCatalog((s) => s.duplicateSongInto)
  const createSong = useCatalog((s) => s.createSong)
  const createAlbum = useCatalog((s) => s.createAlbum)
  const upsertAlbum = useCatalog((s) => s.upsertAlbum)
  const deleteAlbum = useCatalog((s) => s.deleteAlbum)
  const resetToShipped = useCatalog((s) => s.resetToShipped)

  const [draft, setDraft] = useState<SongDraft | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [albumNameDraft, setAlbumNameDraft] = useState<Record<string, string>>({})
  const [openStem, setOpenStem] = useState<number | null>(0)

  const genreOptions = useMemo(() => {
    const set = new Set<string>()
    for (const song of songs) {
      for (const stem of song.stems) if (stem.genre) set.add(stem.genre)
    }
    return [...set].sort()
  }, [songs])

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const song of songs) {
      for (const stem of song.stems) if (stem.type) set.add(stem.type)
    }
    return [...set].sort()
  }, [songs])

  function openSong(songId: string) {
    const live = useCatalog.getState()
    const song = live.songs.find((item) => item.id === songId)
    if (!song) return
    setError('')
    setNotice('')
    setOpenStem(0)
    const albumId = live.albums.find((album) => album.songIds.includes(song.id))?.id ?? live.albums[0]?.id ?? ''
    setDraft(toDraft(song, albumId, live.combos[song.id] ?? emptyCombos()))
  }

  function handleCreateSong(albumId: string) {
    const song = createSong(albumId)
    setNotice('Canção nova criada. Preenche as faixas e o áudio.')
    openSong(song.id)
  }

  function handleDuplicate(songId: string) {
    const copy = duplicateSongInto(songId)
    if (!copy) return
    setNotice('Cópia criada. Pode editar à vontade.')
    openSong(copy.id)
  }

  function handleDelete() {
    if (!pendingDelete) return
    const id = pendingDelete
    deleteSong(id)
    setPendingDelete(null)
    if (draft?.song.id === id) setDraft(null)
    setNotice('Canção apagada neste aparelho.')
  }

  function handleSave() {
    if (!draft) return
    const title = draft.song.title.trim()
    if (!title) {
      setError('A canção precisa de um título.')
      return
    }
    if (!Number.isFinite(draft.song.bpm) || draft.song.bpm < 1 || draft.song.bpm > 400) {
      setError('BPM inválido.')
      return
    }
    if (!Number.isFinite(draft.song.bars) || draft.song.bars < 1) {
      setError('O número de compassos da canção tem de ser pelo menos 1.')
      return
    }
    if (!draft.song.folder.trim() || !draft.song.filePrefix.trim()) {
      setError('Pasta de áudio e prefixo são obrigatórios.')
      return
    }

    const seen = new Set<string>()
    for (const stem of draft.song.stems) {
      if (!stem.character || !stem.instrument.trim() || !stem.type.trim() || !stem.genre.trim()) {
        setError('Cada faixa precisa de personagem, instrumento, tipo e gênero.')
        return
      }
      if (!Number.isFinite(stem.compassos) || stem.compassos < 1) {
        setError(`Compassos inválidos em ${stem.instrument}.`)
        return
      }
      const key = `${stem.character}:${stem.instrument}`
      if (seen.has(key)) {
        setError(`Faixa repetida: ${stem.character} / ${stem.instrument}.`)
        return
      }
      seen.add(key)
    }

    const aliases = draft.song.aliases.map((item) => item.trim()).filter(Boolean)
    const song = applyLimits(
      {
        ...draft.song,
        title,
        aliases,
        folder: draft.song.folder.trim(),
        filePrefix: draft.song.filePrefix.trim(),
        stems: draft.song.stems.map((stem) => {
          const next: StemConfig = {
            character: stem.character,
            instrument: stem.instrument.trim(),
            type: stem.type.trim(),
            genre: stem.genre.trim(),
            compassos: Number(stem.compassos),
            file: stem.file.trim(),
          }
          if (stem.minVolumeDb != null && Number.isFinite(stem.minVolumeDb)) {
            next.minVolumeDb = Number(stem.minVolumeDb)
          }
          if (stem.maxVolumeDb != null && Number.isFinite(stem.maxVolumeDb)) {
            next.maxVolumeDb = Number(stem.maxVolumeDb)
          }
          return next
        }),
      },
      draft.limitRows,
    )

    upsertSong(song, draft.albumId, {
      circle: draft.combos.circle.map((item) => item.trim()).filter(Boolean),
      square: draft.combos.square.map((item) => item.trim()).filter(Boolean),
      triangle: draft.combos.triangle.map((item) => item.trim()).filter(Boolean),
    })
    setError('')
    setNotice('Salvo neste aparelho. A canção já aparece no menu.')
    setDraft(toDraft(song, draft.albumId, draft.combos))
  }

  function handleExport() {
    const catalog = useCatalog.getState()
    const payload = {
      note: 'Overlay local do editor Infanti. O browser não grava songs.json do repositório.',
      storageKey: CATALOG_STORAGE_KEY,
      overlay: overlayFromCatalog({
        albums: catalog.albums,
        songs: catalog.songs,
        combos: catalog.combos,
      }),
      merged: {
        albums: catalog.albums,
        songs: catalog.songs,
        combos: catalog.combos,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'infanti-catalogo.json'
    link.click()
    URL.revokeObjectURL(url)
    setNotice('JSON exportado — cole no repositório se quiser gravar de vez.')
  }

  function handleReset() {
    if (!window.confirm('Restaurar as 5 canções originais do Cancioneiro Popular? As tuas edições neste aparelho desaparecem.')) {
      return
    }
    resetToShipped()
    setDraft(null)
    setNotice('Catálogo de fábrica restaurado.')
  }

  function updateSong<K extends keyof SongConfig>(key: K, value: SongConfig[K]) {
    setDraft((current) => (current ? { ...current, song: { ...current.song, [key]: value } } : current))
  }

  function updateStem(index: number, patch: Partial<StemConfig>) {
    setDraft((current) => {
      if (!current) return current
      const stems = current.song.stems.map((stem, i) => (i === index ? { ...stem, ...patch } : stem))
      return { ...current, song: { ...current.song, stems } }
    })
  }

  const pendingSong = songs.find((song) => song.id === pendingDelete)

  return (
    <div className="song-editor" role="dialog" aria-label="Editor de músicas">
      <header className="song-editor-bar">
        <button type="button" className="editor-ghost" onClick={onClose}>
          ← Menu
        </button>
        <div>
          <strong>Editor de músicas</strong>
          <p>Álbuns, canções e faixas — as crianças continuam a jogar pelo menu.</p>
        </div>
        <div className="song-editor-bar-actions">
          <button
            type="button"
            className="editor-primary editor-create"
            onClick={() => handleCreateSong(draft?.albumId || albums[0]?.id || '')}
          >
            Nova música
          </button>
          <button type="button" className="editor-ghost" onClick={handleExport}>
            Exportar JSON
          </button>
          <button type="button" className="editor-ghost" onClick={handleReset}>
            Restaurar originais
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className={`editor-banner ${error ? 'is-error' : ''}`}>{error || notice}</div>
      )}

      <div className="song-editor-body">
        <aside className="editor-nav">
          {albums.map((album) => (
            <AlbumBlock
              key={album.id}
              album={album}
              songs={songs.filter((song) => album.songIds.includes(song.id))}
              selectedId={draft?.song.id}
              nameValue={albumNameDraft[album.id] ?? album.name}
              canDelete={albums.length > 1}
              onNameChange={(value) => setAlbumNameDraft((current) => ({ ...current, [album.id]: value }))}
              onRename={() => {
                const name = (albumNameDraft[album.id] ?? album.name).trim()
                if (name) upsertAlbum({ ...album, name })
              }}
              onDelete={() => {
                if (window.confirm(`Apagar o álbum «${album.name}»? As canções passam para outro álbum.`)) {
                  deleteAlbum(album.id)
                  if (draft?.albumId === album.id) {
                    setDraft((current) =>
                      current
                        ? { ...current, albumId: albums.find((item) => item.id !== album.id)?.id ?? current.albumId }
                        : current,
                    )
                  }
                }
              }}
              onOpen={openSong}
              onDuplicate={handleDuplicate}
              onAskDelete={setPendingDelete}
              onCreate={() => handleCreateSong(album.id)}
            />
          ))}
          <button
            type="button"
            className="editor-add editor-add-album"
            onClick={() => {
              const album = createAlbum('Novo álbum')
              setAlbumNameDraft((current) => ({ ...current, [album.id]: album.name }))
            }}
          >
            + Novo álbum
          </button>
        </aside>

        <section className="editor-form-wrap">
          {!draft ? (
            <div className="editor-empty">
              <p>Escolha uma canção à esquerda ou crie uma nova.</p>
              <p>Pode mudar título, BPM, tema, faixas, limites e os 3 combos de prêmio.</p>
            </div>
          ) : (
            <form
              className="editor-form"
              onSubmit={(event) => {
                event.preventDefault()
                handleSave()
              }}
            >
              <div className="editor-form-head">
                <h2>{draft.song.title || 'Canção sem título'}</h2>
                <div className="editor-form-head-actions">
                  <button type="button" className="editor-ghost" onClick={() => setPendingDelete(draft.song.id)}>
                    Apagar
                  </button>
                  <button type="submit" className="editor-primary editor-save">
                    Salvar
                  </button>
                </div>
              </div>

              <fieldset>
                <legend>Identidade</legend>
                <label>
                  Título
                  <input
                    value={draft.song.title}
                    onChange={(event) => updateSong('title', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Id
                  <input value={draft.song.id} readOnly />
                </label>
                <label>
                  Álbum
                  <select
                    value={draft.albumId}
                    onChange={(event) => setDraft((current) => (current ? { ...current, albumId: event.target.value } : current))}
                  >
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  BPM
                  <input
                    type="number"
                    min={1}
                    max={400}
                    value={draft.song.bpm}
                    onChange={(event) => updateSong('bpm', Number(event.target.value))}
                  />
                </label>
                <label>
                  Compassos da canção
                  <input
                    type="number"
                    min={1}
                    value={draft.song.bars}
                    onChange={(event) => updateSong('bars', Number(event.target.value))}
                  />
                </label>
                <label>
                  Pasta de áudio
                  <input
                    value={draft.song.folder}
                    onChange={(event) => updateSong('folder', event.target.value)}
                    placeholder="infanti_dona_aranha"
                  />
                </label>
                <label>
                  Prefixo dos arquivos
                  <input
                    value={draft.song.filePrefix}
                    onChange={(event) => updateSong('filePrefix', event.target.value)}
                  />
                </label>
                <label className="editor-wide">
                  Apelidos (separados por vírgula)
                  <input
                    value={draft.song.aliases.join(', ')}
                    onChange={(event) =>
                      updateSong(
                        'aliases',
                        event.target.value.split(',').map((item) => item.trim()),
                      )
                    }
                    placeholder="dona_aranha"
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>Tema do palco</legend>
                {THEME_FIELDS.map((field) => (
                  <label key={field.key} className="editor-color">
                    {field.label}
                    <span>
                      <input
                        type="color"
                        value={draft.song.theme[field.key]}
                        onChange={(event) =>
                          updateSong('theme', { ...draft.song.theme, [field.key]: event.target.value })
                        }
                      />
                      <input
                        value={draft.song.theme[field.key]}
                        onChange={(event) =>
                          updateSong('theme', { ...draft.song.theme, [field.key]: event.target.value })
                        }
                      />
                    </span>
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>Limite no palco</legend>
                <p className="editor-hint">Quantos instrumentos cada personagem pode ter em palco. Vazio = sem limite.</p>
                {draft.limitRows.map((row, index) => (
                  <div key={`${row.character}-${index}`} className="editor-limit-row">
                    <select
                      value={row.character}
                      onChange={(event) => {
                        const character = event.target.value as CharacterId
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                limitRows: current.limitRows.map((item, i) =>
                                  i === index ? { ...item, character } : item,
                                ),
                              }
                            : current,
                        )
                      }}
                    >
                      {CHARACTER_ORDER.map((id) => (
                        <option key={id} value={id}>
                          {CHARACTERS[id].name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={row.limit}
                      onChange={(event) => {
                        const limit = Number(event.target.value)
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                limitRows: current.limitRows.map((item, i) =>
                                  i === index ? { ...item, limit } : item,
                                ),
                              }
                            : current,
                        )
                      }}
                    />
                    <button
                      type="button"
                      className="editor-ghost"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? { ...current, limitRows: current.limitRows.filter((_, i) => i !== index) }
                            : current,
                        )
                      }
                    >
                      Tirar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="editor-add editor-add-limit"
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? { ...current, limitRows: [...current.limitRows, { character: 'boogar', limit: 1 }] }
                        : current,
                    )
                  }
                >
                  + Limite
                </button>
              </fieldset>

              <fieldset>
                <legend>Prêmios (combos)</legend>
                <p className="editor-hint">4 instrumentos por símbolo, como em combos.json.</p>
                {COMBO_SHAPES.map((shape) => (
                  <div key={shape} className="editor-combo-row">
                    <span>{COMBO_LABELS[shape]}</span>
                    {padCombo(draft.combos[shape]).map((value, index) => (
                      <input
                        key={`${shape}-${index}`}
                        list={`instrument-ids-${draft.song.id}`}
                        value={value}
                        onChange={(event) => {
                          const next = padCombo(draft.combos[shape])
                          next[index] = event.target.value
                          setDraft((current) =>
                            current ? { ...current, combos: { ...current.combos, [shape]: next } } : current,
                          )
                        }}
                      />
                    ))}
                  </div>
                ))}
                <datalist id={`instrument-ids-${draft.song.id}`}>
                  {draft.song.stems.map((stem) => (
                    <option key={`${stem.character}-${stem.instrument}`} value={stem.instrument} />
                  ))}
                </datalist>
              </fieldset>

              <fieldset>
                <legend>Faixas ({draft.song.stems.length})</legend>
                <p className="editor-hint">
                  Os campos são os de songs.json. O arquivo fica em <code>/audio/{'{pasta}'}/{'{arquivo}'}</code>.
                </p>
                {draft.song.stems.map((stem, index) => (
                  <div key={`${stem.character}-${stem.instrument}-${index}`} className="stem-card">
                    <button
                      type="button"
                      className="stem-card-toggle"
                      onClick={() => setOpenStem((current) => (current === index ? null : index))}
                    >
                      <span>
                        {CHARACTERS[stem.character]?.name ?? stem.character} · {stem.instrument || 'sem id'}
                      </span>
                      <small>
                        {stem.genre} · {stem.type} · {stem.compassos}c
                      </small>
                    </button>
                    {openStem === index && (
                      <div className="stem-card-body">
                        <label>
                          Personagem
                          <select
                            value={stem.character}
                            onChange={(event) => updateStem(index, { character: event.target.value as CharacterId })}
                          >
                            {CHARACTER_ORDER.map((id) => (
                              <option key={id} value={id}>
                                {CHARACTERS[id].name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Instrumento
                          <input
                            value={stem.instrument}
                            onChange={(event) => updateStem(index, { instrument: event.target.value })}
                          />
                        </label>
                        <label>
                          Tipo (balão)
                          <input
                            list="stem-types"
                            value={stem.type}
                            onChange={(event) => updateStem(index, { type: event.target.value })}
                          />
                        </label>
                        <label>
                          Gênero
                          <input
                            list="stem-genres"
                            value={stem.genre}
                            onChange={(event) => updateStem(index, { genre: event.target.value })}
                          />
                        </label>
                        <label>
                          Compassos
                          <input
                            type="number"
                            min={1}
                            value={stem.compassos}
                            onChange={(event) => updateStem(index, { compassos: Number(event.target.value) })}
                          />
                        </label>
                        <label className="editor-wide">
                          Arquivo .ogg
                          <input
                            value={stem.file}
                            onChange={(event) => updateStem(index, { file: event.target.value })}
                            placeholder={`${draft.song.filePrefix}_${stem.genre}_….ogg`}
                          />
                        </label>
                        <label>
                          dB mín.
                          <input
                            type="number"
                            value={stem.minVolumeDb ?? ''}
                            onChange={(event) =>
                              updateStem(index, {
                                minVolumeDb: event.target.value === '' ? undefined : Number(event.target.value),
                              })
                            }
                          />
                        </label>
                        <label>
                          dB máx.
                          <input
                            type="number"
                            value={stem.maxVolumeDb ?? ''}
                            onChange={(event) =>
                              updateStem(index, {
                                maxVolumeDb: event.target.value === '' ? undefined : Number(event.target.value),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="editor-ghost"
                          onClick={() => {
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    song: {
                                      ...current.song,
                                      stems: current.song.stems.filter((_, i) => i !== index),
                                    },
                                  }
                                : current,
                            )
                            setOpenStem(null)
                          }}
                        >
                          Remover faixa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <datalist id="stem-genres">
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre} />
                  ))}
                </datalist>
                <datalist id="stem-types">
                  {typeOptions.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="editor-add editor-add-stem"
                  onClick={() => {
                    setDraft((current) => {
                      if (!current) return current
                      const stems = [...current.song.stems, createBlankStem()]
                      setOpenStem(stems.length - 1)
                      return { ...current, song: { ...current.song, stems } }
                    })
                  }}
                >
                  + Faixa
                </button>
              </fieldset>
            </form>
          )}
        </section>
      </div>

      {pendingDelete && (
        <div className="editor-modal" role="alertdialog" aria-label="Confirmar apagar">
          <div className="editor-modal-card">
            <p>
              Apagar <strong>{pendingSong?.title ?? pendingDelete}</strong>? Some do menu neste aparelho. As canções
              originais voltam em “Restaurar originais”.
            </p>
            <div className="editor-form-head-actions">
              <button type="button" className="editor-ghost" onClick={() => setPendingDelete(null)}>
                Cancelar
              </button>
              <button type="button" className="editor-danger" onClick={handleDelete}>
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AlbumBlock({
  album,
  songs,
  selectedId,
  nameValue,
  canDelete,
  onNameChange,
  onRename,
  onDelete,
  onOpen,
  onDuplicate,
  onAskDelete,
  onCreate,
}: {
  album: AlbumConfig
  songs: SongConfig[]
  selectedId?: string
  nameValue: string
  canDelete: boolean
  onNameChange: (value: string) => void
  onRename: () => void
  onDelete: () => void
  onOpen: (id: string) => void
  onDuplicate: (id: string) => void
  onAskDelete: (id: string) => void
  onCreate: () => void
}) {
  return (
    <section className="editor-album">
      <div className="editor-album-head">
        <input
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={onRename}
          aria-label={`Nome do álbum ${album.name}`}
        />
        {canDelete && (
          <button type="button" className="editor-ghost" onClick={onDelete} aria-label={`Apagar álbum ${album.name}`}>
            ×
          </button>
        )}
      </div>
      <ul>
        {songs.map((song) => (
          <li key={song.id} className={selectedId === song.id ? 'is-selected' : ''}>
            <button type="button" className="editor-song-pick" onClick={() => onOpen(song.id)}>
              <strong>{song.title}</strong>
              <span>{song.bpm} BPM</span>
            </button>
            <div className="editor-song-tools">
              <button type="button" onClick={() => onDuplicate(song.id)}>
                Duplicar
              </button>
              <button type="button" onClick={() => onAskDelete(song.id)}>
                Apagar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="editor-add editor-add-song" onClick={onCreate}>
        + Nova música
      </button>
    </section>
  )
}
