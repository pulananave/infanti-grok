# Infanti

Jogo web de palco musical infantil — **Groovy Gang Infanti**. A criança escolhe uma canção, abre o balão do personagem, arrasta o instrumento para o chão 3D e monta a banda em camadas.

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

| Canção | BPM | pasta / prefixo |
| --- | --- | --- |
| Dona Aranha | 114 | `infanti_aranha` / `aranha` (alias `dona_aranha`) |
| A Canoa Virou | 118 | `infanti_canoa` / `canoa` |
| Coelhinho da Páscoa | 96 | `infanti_coelho` / `coelho` |
| Pintinho Amarelinho | 148 | `infanti_pintinho` / `pintinho` |
| O Sapo Não Lava o Pé | 138 | `infanti_sapo` / `sapo` |

Elenco: Boogar, Ceval, Dan, Esper, Gobu, Grompy, Ohle, Rafog, Teewong, Zoem e Gerarda. Gerarda **não** entra nestas 5 músicas.

A bandeja cria **um círculo por personagem da canção** e **não tem limite de 20**. Pode passar de 20 vagas sem mudar o código.

## Trocar o áudio pelo pacote MEGA

Os stems de agora são placeholders gerados (`npm run audio`). Para usar os arquivos reais:

1. Baixe o pacote MEGA.
2. Copie cada stem para a pasta da canção:

```text
public/audio/infanti_<canção>/<canção>_<gênero>_<instrumento>.ogg
```

Exemplos:

```text
public/audio/infanti_aranha/aranha_pop_drums.ogg
public/audio/infanti_canoa/canoa_samba_guitar.ogg
public/audio/infanti_sapo/sapo_jazz_saxophone.ogg
```

3. O nome do arquivo precisa bater com a config em `src/config/songs.json` (`filePrefix`, `genre`, `instrument`).
4. Se o pacote vier como `dona_aranha_...` ou na pasta `infanti_dona_aranha`, o loader também tenta esses aliases. O jeito mais limpo é padronizar no prefixo curto (`aranha_`).
5. **Não use loop nativo no arquivo.** Os stems têm cauda. O jogo agenda o recomeço na grade (`bpm × compassos`, 4/4).
6. Recoloque o arquivo com o mesmo nome — sem rebuild de config. Só precisa gerar o site de novo se quiser publicar (`npm run build`).

Para regenerar os placeholders:

```bash
npm run audio
```

## Editar os combos

Os prêmios v1 leem `src/config/combos.json`. Cada canção tem três formas (`circle`, `square`, `triangle`) com **4 instrumentos**.

```json
{
  "aranha": {
    "circle": ["drums", "bass", "guitar", "piano"],
    "square": ["flute", "cello", "xylophone", "vocals"],
    "triangle": ["trumpet", "saxophone", "electric_guitar", "dj"]
  }
}
```

Regras:

- Use ids de instrumento que existam na canção em `songs.json`.
- A fatia pinta quando aquele instrumento está no palco.
- 4/4 abre o prêmio visual.

Depois de editar, rode `npm run dev` ou `npm run build`.

## Editar músicas e personagens

`src/config/songs.json` define BPM, tema do palco e cada stem:

```json
{
  "character": "boogar",
  "instrument": "drums",
  "genre": "pop",
  "compassos": 2
}
```

O caminho do áudio vira `/audio/<folder>/<filePrefix>_<genre>_<instrument>.ogg`.

Personagens e aparência: `src/config/characters.ts`.

## Controles no palco

- Toque no círculo da bandeja → balão amarelo.
- Arraste o ícone do instrumento até o chão → personagem + som.
- Arraste o personagem para reposicionar (volume pela distância do ouvinte, marca clara na frente do palco).
- Toque curto no personagem → mudo.
- Arraste o personagem de volta para a bandeja → some do palco e o instrumento volta ao balão.
- Casa (home) → limpa, para o áudio e volta ao menu.

## Deploy (Vercel)

Projeto estático. Build: `npm run build`. Pasta: `dist`. `vercel.json` já aponta o output.
