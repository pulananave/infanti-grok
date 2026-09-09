# Infanti

Jogo web de palco musical infantil — **Groovy Gang Infanti**. A criança escolhe uma canção, abre o balão do personagem, arrasta o instrumento para o chão 3D e monta a banda em camadas.

Repositório: [github.com/pulananave/infanti-grok](https://github.com/pulananave/infanti-grok).

Feito com Vite + React + TypeScript + React Three Fiber. Build estático para a Vercel (`npm run build` → `dist`).

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

Elenco: Boogar, Ceval, Dan, Esper, Gobu, Grompy, Ohle, Rafog, Teewong, Zoem e Gerarda. Nestas 5 canções a bandeja só mostra quem aparece no `.cfg` Godot (Boogar–Teewong). **Zoem e Gerarda** ficam de fora.

A bandeja cria **um círculo por personagem da canção** e **não tem limite de 20**. Pode passar de 20 vagas sem mudar o código.

## Áudio real (MEGA)

Os stems em `public/audio/` são os `.ogg` do pacote MEGA (pastas `infanti_*` apenas). Placeholders gerados **não** entram no runtime.

Convenção das pastas: nomes MEGA, sem renomear arquivos.

```text
public/audio/infanti_dona_aranha/aranha_latin_agogo.ogg
public/audio/infanti_canoa_virou/canoa_marcial_trompete.ogg
public/audio/infanti_coelho/coelho_voz_kaio.ogg
```

A fonte da verdade de quem toca o quê é `src/config/audio-configs/*.cfg` (Godot). `npm run sync-audio` lê esses arquivos, resolve o `.ogg` MEGA (espaços ↔ `_`/`-`, `marcial`/`mar`, `trompete`/`trumpete`) e reescreve `songs.json`. **Não inventar stems** que não estejam no `.cfg`.

Cada stem tem:

- `file` — nome exato do `.ogg` no disco
- `instrument` — id estável `{gênero}_{resto}` (`latin_agogo`, `voz_kaio`)
- `type` — identidade Godot para o balão (`Pratos`, `Voz`, `BateriaPop`, `SynthBass`, …)
- `compassos` — `bars` do instrumento (loop na grade `bpm × compassos`, 4/4)
- `minVolumeDb` / `maxVolumeDb` — quando o `.cfg` traz, o ganho no palco interpola desses dB (frente = max, fundo = min). Sem esses campos, continua 1.0 → 0.2.

`instrumentUseLimit` por personagem (ex. Gobu = 1 em Aranha/Canoa/Pintinho, Dan = 1 no Coelho) impede colocar mais instrumentos do que o limite.

**Não use loop nativo no arquivo.** O jogo agenda o recomeço na grade. `npm run audio` confere que todo `file` do `.cfg` existe. Arquivos MEGA que não entram no `.cfg` ficam no disco mas não são oferecidos.

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
- A fatia do símbolo 3D no anteparo acende quando aquele instrumento está no palco.
- 4/4 acende o objeto inteiro e abre o prêmio visual. O brilho some se a combinação sair do palco.

Depois de editar, rode `npm run dev` ou `npm run build`.

## Editar músicas e personagens

`src/config/songs.json` define BPM, tema do palco e cada stem:

```json
{
  "character": "boogar",
  "instrument": "marcial_pratos",
  "type": "Pratos",
  "genre": "marcial",
  "compassos": 8,
  "file": "aranha_marcial_pratos.ogg"
}
```

O caminho do áudio é `/audio/<folder>/<file>`. Ícones da bandeja: pack original em `assets/tray-icons/` → `public/icons/monsters/` (`node scripts/write-monster-icons.mjs`). Zoem/Gerarda continuam com placeholder.

Personagens e aparência 3D: `src/config/characters.ts`.

## Controles no palco

- Toque no círculo da bandeja → balão amarelo.
- Arraste o ícone do instrumento até o chão → personagem + som.
- Arraste o personagem para reposicionar (volume pela distância do ouvinte, marca clara na frente do palco).
- Toque curto no personagem → mudo.
- Arraste o personagem de volta para a bandeja → some do palco e o instrumento volta ao balão.
- Casa (home) → limpa, para o áudio e volta ao menu.

## Deploy (Vercel)

Projeto estático. Build: `npm run build`. Pasta: `dist`. `vercel.json` já aponta o output.
