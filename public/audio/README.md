# Infanti stems

Real MEGA stems, not generated placeholders.

## Layout

Keep the MEGA folder names:

```text
public/audio/infanti_dona_aranha/*.ogg
public/audio/infanti_canoa_virou/*.ogg
public/audio/infanti_coelho/*.ogg
public/audio/infanti_pintinho/*.ogg
public/audio/infanti_sapo_nao_lava/*.ogg
```

Only `.ogg` files are shipped. Godot `.import` / `.tres` / images from the pack are ignored.

## Filenames

MEGA names are `{song}_{genre}_{instrument-or-voice}.ogg`:

```text
aranha_latin_agogo.ogg
aranha_marcial_trompete.ogg
aranha_voz_kaio.ogg
pintinho_melo_trumpete.ogg
sapo_mar_picolo.ogg
```

`src/config/songs.json` points at these exact filenames via each stem’s `file` field. Do not invent paths.

To rebuild the JSON from the files on disk (character + compassos rules live in the script):

```bash
npm run sync-audio
npm run audio
```
