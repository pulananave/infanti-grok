# Infanti

Jogo web de palco musical infantil — **Groovy Gang Infanti**. A criança escolhe uma canção, abre o balão do personagem, arrasta o instrumento para o chão 2.5D e monta a banda em camadas.

Repositório: [github.com/pulananave/infanti-grok](https://github.com/pulananave/infanti-grok).

Feito com Vite + React + TypeScript + React Three Fiber. O palco visível é uma imagem estática; os personagens são planes billboard com spritesheets TexturePacker. A câmera ¾ e o chão invisível continuam a cuidar de profundidade, escala e volume. Build estático para a Vercel (`npm run build` → `dist`).

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

O alvo visual é **paisagem no celular**. Em retrato o jogo ainda abre, com um aviso para deitar o aparelho.

## Canções

| Canção | BPM | pasta MEGA / prefixo |
| --- | --- | --- |
| Dona Aranha | 114 | `infanti_dona_aranha` / `aranha` (alias `dona_aranha`) |
| A Canoa Virou | 118 | `infanti_canoa_virou` / `canoa` |
| Coelhinho da Páscoa | 96 | `infanti_coelho` / `coelho` |
| Pintinho Amarelinho | 148 | `infanti_pintinho` / `pintinho` |
| O Sapo Não Lava o Pé | 138 | `infanti_sapo_nao_lava` / `sapo` |

Elenco: Boogar, Ceval, Dan, Esper, Gobu, Grompy, Ohle, Rafog, Teewong, Zoem e Gerarda. Gerarda **não** entra nestas 5 músicas.

A bandeja cria **um círculo por personagem da canção** e **não tem limite de 20**. Pode passar de 20 vagas sem mudar o código.

## Áudio real (MEGA)

Os stems em `public/audio/` são os `.ogg` do pacote MEGA (pastas `infanti_*` apenas). Placeholders gerados **não** entram no runtime.

Convenção das pastas: nomes MEGA, sem renomear arquivos.

```text
public/audio/infanti_dona_aranha/aranha_latin_agogo.ogg
public/audio/infanti_canoa_virou/canoa_marcial_trompete.ogg
public/audio/infanti_coelho/coelho_voz_kaio.ogg
```

Cada entrada em `src/config/songs.json` tem `file` com o nome **exato** do `.ogg` no disco. O id do instrumento no balão é `{gênero}_{resto}` (`latin_agogo`, `voz_kaio`, `marcial_trompete`).

Personagens por família (elenco destas 5 canções):

| Personagem | Stems |
| --- | --- |
| Boogar | bateria e percussão (`agogo`, `conga`, `shaker`, `pandeirola`, …) |
| Ceval | `baixo` |
| Dan | `violao`, `gtr_base` pop, `gtr_frase` |
| Esper | piano, rhodes, marimba, sanfona, órgão |
| Gobu | trompete (`trompete` / `trumpete`) |
| Grompy | tuba e perc. marcial (`bombo`, `caixa`, `pratos`) |
| Ohle | pícolo + vozes (`voz_kaio`, `voz_loli`, …) |
| Rafog | guitarra rock (`gtr_base`, `gtr_melodia`, `guitarra_base`) |
| Teewong | trombone e violino (não há sax/clarinete nestes stems) |
| Zoem | EDM / loops / synth |

`compassos` vem da duração do arquivo ÷ duração do compasso (`bpm`, 4/4). Stems longos (ex. Sapo ~54 compassos) loopam no fim do arquivo.

**Não use loop nativo no arquivo.** O jogo agenda o recomeço na grade. `npm run audio` só confere que todo `file` existe. `npm run sync-audio` regenera `songs.json` a partir dos `.ogg` no disco.

## Editar os combos

Os prêmios v1 leem `src/config/combos.json`. Cada canção tem três formas (`circle`, `square`, `triangle`) com **4 instrumentos**.

```json
{
  "aranha": {
    "circle": ["pop_bateria", "pop_baixo", "pop_gtr_base", "pop_piano"],
    "square": ["latin_agogo", "latin_violao", "latin_conga", "latin_marimba"],
    "triangle": ["marcial_trompete", "rock_gtr_melodia", "voz_kaio", "melo_synth"]
  }
}
```

Regras:

- Use ids de instrumento que existam na canção em `songs.json` (`latin_agogo`, não `drums`).
- A fatia pinta quando aquele instrumento está no palco.
- 4/4 abre o prêmio visual.

Depois de editar, rode `npm run dev` ou `npm run build`.

## Editar músicas e personagens

`src/config/songs.json` define BPM, tema do palco e cada stem:

```json
{
  "character": "boogar",
  "instrument": "latin_agogo",
  "genre": "latin",
  "compassos": 2,
  "file": "aranha_latin_agogo.ogg"
}
```

O caminho do áudio é `/audio/<folder>/<file>`.

Personagens da bandeja: `src/config/characters.ts`.

## Spritesheets 2.5D

Os atlas oficiais ficam em `public/runtime-2d/spritesheets/`. O mapa editável é `src/config/spriteMap.json`.

### FPS

```text
fps = 20 * (songBpm / 120)
```

20 frames = 1 segundo no BPM de referência (120). A animação usa cada região única do `.tpsheet` em ordem cronológica do índice no filename (aliases do TexturePacker que apontam para a mesma região não se repetem).

### Como adicionar um spritesheet

1. Coloque `nome.tpsheet` e o atlas (`nome-0.png`, e `nome-1.png` se houver segunda página, ou o `image` exato do tpsheet) em `public/runtime-2d/spritesheets/` (subpasta do personagem vale).
2. Adicione o caminho relativo em `sheetFiles`, com um id curto.
3. Aponte `characters.<id>.tokens.<sufixo>` (ex. `agogo` para `latin_agogo`) ou `instruments.<id>.sheet` para esse id.
4. Opcional: `icon` no binding, `genreSheets.<instrumento-ou-token>.<gênero>` para variar a pose; stickers em `public/runtime-2d/instruments/` (`icons` / `iconTokens` / `kindIcons`).

O balão usa `public/runtime-2d/balloon/BALAO_CENTRO.svg` e os stickers do pacote. A bandeja mantém os ícones de rosto do elenco.

## Controles no palco

- Toque no círculo da bandeja → balão amarelo.
- Arraste o ícone do instrumento até o chão → personagem + som.
- Arraste o personagem para reposicionar (volume pela distância do ouvinte, marca clara na frente do palco).
- Toque curto no personagem → mudo.
- Arraste o personagem de volta para a bandeja → some do palco e o instrumento volta ao balão.
- Casa (home) → limpa, para o áudio e volta ao menu.

## Deploy (Vercel)

Projeto estático. Build: `npm run build`. Pasta: `dist`. `vercel.json` já aponta o output.
