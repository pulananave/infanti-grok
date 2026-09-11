# Texturas e imagens (Jelly Band / Infanti)

Palco e personagens usam materiais procedurais (`ToyMaterial` + normal em canvas em
`src/theme/toyNormals.ts`), **exceto o piloto híbrido** (`/?texPilot=1`):
Boogar e os quadrados do chão leem albedo/normal compactos em `public/textures/`.
O IBL é um `Environment` do drei com Lightformers (céu pastel), sem `.hdr`/`.exr`.
O céu do fundo é `GradientTexture` gerado.

## Piloto híbrido (`?texPilot=1`)

`scripts/gen-tex-pilot.py` projecta o sheet oficial Coral Pudge
(`scripts/refs/boogar-character.png`, release `jelly-character-sheets`)
para um atlas UV 1024. Não é só cor+ruído: cara, barriga, braço, pata e
garra vêm de recortes do sheet.

Atlas (`public/textures/boogar/albedo.png`, flipY=true):

| Ilha | UV | Região do sheet |
| --- | --- | --- |
| `body` | u 0–1, v 0.50–1.00 | unwrap equirectangular: frente @ u=0.25 (cara neutral + barriga), perfil, costas |
| `arm` | 0.02–0.23 × 0.27–0.48 | braço da pose de acção + ponta #2A012D |
| `leg` | 0.27–0.48 × 0.27–0.48 | perna da pose |
| `ear` | 0.52–0.73 × 0.27–0.48 | orelha do tile Neutral |
| `claw` | 0.77–0.98 × 0.27–0.48 | close-up de resina polida |
| `hand` | 0.02–0.23 × 0.02–0.23 | pata com garras |
| `earInner` | 0.27–0.48 × 0.02–0.23 | fibra barriga `#FFB6A0` |

Com `texPilot`, Boogar esconde olhos/sobrancelha/boca procedurais — a cara
lida no albedo. Os outros 10 monstros continuam procedurais. O chão do #20
mantém-se.

- `public/textures/boogar/albedo.png` (1024, atlas v2)
- `public/textures/boogar/normal.png` (1024)
- `public/textures/floor/silicone_albedo.png` (512)
- `public/textures/floor/silicone_normal.png` (512)

## Runtime (servidas de `public/`)

### Piloto híbrido (só com `?texPilot=1`)
- `public/textures/boogar/albedo.png`
- `public/textures/boogar/normal.png`
- `public/textures/floor/silicone_albedo.png`
- `public/textures/floor/silicone_normal.png`

### Favicon
- `public/favicon.svg`

### Tray / personagens (SVG)
- `public/icons/monsters/ICONE_BOOGAR_ATIVO.svg`
- `public/icons/monsters/ICONE_BOOGAR.svg`
- `public/icons/monsters/ICONE_CEVAL_ATIVO.svg`
- `public/icons/monsters/ICONE_CEVAL.svg`
- `public/icons/monsters/ICONE_GROMPY_ATIVO.svg`
- `public/icons/monsters/ICONE_GROMPY.svg`
- `public/icons/monsters/ICONE_MONSTRO04_ATIVO.svg`
- `public/icons/monsters/ICONE_MONSTRO04.svg`
- `public/icons/monsters/ICONE_MONSTRO05_ATIVO.svg`
- `public/icons/monsters/ICONE_MONSTRO05.svg`
- `public/icons/monsters/ICONE_MONSTRO07_ATIVO.svg`
- `public/icons/monsters/ICONE_MONSTRO07.svg`
- `public/icons/monsters/ICONE_OHLE_ATIVO.svg`
- `public/icons/monsters/ICONE_OHLE.svg`
- `public/icons/monsters/ICONE_RAFOG_ATIVO.svg`
- `public/icons/monsters/ICONE_RAFOG.svg`
- `public/icons/monsters/ICONE_TEEWONG_ATIVO.svg`
- `public/icons/monsters/ICONE_TEEWONG.svg`
- `public/icons/monsters/LENTE.svg`

### Instrumentos (SVG)
- `public/instrument_icons/AGOGO.svg`
- `public/instrument_icons/BAIXO-ACUSTICO.svg`
- `public/instrument_icons/BAIXO_ELETRICO.svg`
- `public/instrument_icons/BAIXO_ROCK.svg`
- `public/instrument_icons/BATERIA_ELETRONICA2.svg`
- `public/instrument_icons/BATERIA_ELETRONICA_3.svg`
- `public/instrument_icons/BATERIA_ELETRONICA.svg`
- `public/instrument_icons/BATERIA_LATIN.svg`
- `public/instrument_icons/BATERIA_POP.svg`
- `public/instrument_icons/BATERIA_ROCK.svg`
- `public/instrument_icons/BATERIA.svg`
- `public/instrument_icons/BOMBO.svg`
- `public/instrument_icons/BONGO.svg`
- `public/instrument_icons/CAIXA.svg`
- `public/instrument_icons/CONGA.svg`
- `public/instrument_icons/GUITARRA_BASE.svg`
- `public/instrument_icons/GUITARRA_FRASE.svg`
- `public/instrument_icons/GUITARRA_ROCK.svg`
- `public/instrument_icons/MARIMBA_2.svg`
- `public/instrument_icons/MARIMBA.svg`
- `public/instrument_icons/MICROFONE.svg`
- `public/instrument_icons/ORGAO.svg`
- `public/instrument_icons/PANDEIROLA.svg`
- `public/instrument_icons/PICOLO2.svg`
- `public/instrument_icons/PICOLO.svg`
- `public/instrument_icons/PRATOS.svg`
- `public/instrument_icons/RECORECO.svg`
- `public/instrument_icons/RELOGIO.svg`
- `public/instrument_icons/RHODES.svg`
- `public/instrument_icons/SANFONA.svg`
- `public/instrument_icons/SHAKER.svg`
- `public/instrument_icons/SYNTH_BASS.svg`
- `public/instrument_icons/SYNTH.svg`
- `public/instrument_icons/TROMBONE.svg`
- `public/instrument_icons/TROMPETE.svg`
- `public/instrument_icons/TUBA.svg`
- `public/instrument_icons/VIOLAO.svg`
- `public/instrument_icons/VIOLINO.svg`

## Cópias de origem (não carregadas em runtime)
`scripts/refs/boogar-character.png` — sheet oficial (release `jelly-character-sheets`).
`scripts/refs/boogar-fiber.png` — swatch de fibra para o chão / fill.
`assets/tray-icons/` — pack original; o app usa `public/icons/monsters/`.
- `assets/tray-icons/ICONE_BOOGAR_ATIVO.png`
- `assets/tray-icons/ICONE_BOOGAR_ATIVO.svg`
- `assets/tray-icons/ICONE_BOOGAR.png`
- `assets/tray-icons/ICONE_BOOGAR.svg`
- `assets/tray-icons/ICONE_CEVAL_ATIVO.png`
- `assets/tray-icons/ICONE_CEVAL_ATIVO.svg`
- `assets/tray-icons/ICONE_CEVAL.png`
- `assets/tray-icons/ICONE_CEVAL.svg`
- `assets/tray-icons/ICONE_GROMPY_ATIVO.png`
- `assets/tray-icons/ICONE_GROMPY_ATIVO.svg`
- `assets/tray-icons/ICONE_GROMPY.png`
- `assets/tray-icons/ICONE_GROMPY.svg`
- `assets/tray-icons/ICONE_MONSTRO04_ATIVO.png`
- `assets/tray-icons/ICONE_MONSTRO04_ATIVO.svg`
- `assets/tray-icons/ICONE_MONSTRO04.png`
- `assets/tray-icons/ICONE_MONSTRO04.svg`
- `assets/tray-icons/ICONE_MONSTRO05_ATIVO.png`
- `assets/tray-icons/ICONE_MONSTRO05_ATIVO.svg`
- `assets/tray-icons/ICONE_MONSTRO05.png`
- `assets/tray-icons/ICONE_MONSTRO05.svg`
- `assets/tray-icons/ICONE_MONSTRO07_ATIVO.png`
- `assets/tray-icons/ICONE_MONSTRO07_ATIVO.svg`
- `assets/tray-icons/ICONE_MONSTRO07.png`
- `assets/tray-icons/ICONE_MONSTRO07.svg`
- `assets/tray-icons/ICONE_OHLE_ATIVO.png`
- `assets/tray-icons/ICONE_OHLE_ATIVO.svg`
- `assets/tray-icons/ICONE_OHLE.png`
- `assets/tray-icons/ICONE_OHLE.svg`
- `assets/tray-icons/ICONE_RAFOG_ATIVO.png`
- `assets/tray-icons/ICONE_RAFOG_ATIVO.svg`
- `assets/tray-icons/ICONE_RAFOG.png`
- `assets/tray-icons/ICONE_RAFOG.svg`
- `assets/tray-icons/ICONE_TEEWONG_ATIVO.png`
- `assets/tray-icons/ICONE-TEEWONG-ATIVO.svg`
- `assets/tray-icons/ICONE_TEEWONG.png`
- `assets/tray-icons/ICONE_TEEWONG.svg`
- `assets/tray-icons/LENTE.png`
- `assets/tray-icons/LENTE.svg`
- `assets/tray-icons/LENTE.txt`
