# Infanti — conceito

Infanti é um jogo musical infantil no espírito **Groovy Gang**: um palco 3D onde a criança monta a banda, mistura estilos e escuta a música nascer em camadas.

Código: [github.com/pulananave/infanti-grok](https://github.com/pulananave/infanti-grok).

O recorte desta versão é **mobile em paisagem**. Retrato existe como breakpoint posterior (layout empilhado + aviso), sem ser o alvo principal.

## Telas

1. **Menu de canções** — cinco músicas da infância brasileira.
2. **Palco** — fundo único por canção (placeholder 3D), bandeja, balão, combos e personagens.
3. **Sair / Home** — limpa o palco, para e zera o áudio, volta ao menu.

## Canções e BPM

| Canção | BPM | ids |
| --- | --- | --- |
| Dona Aranha | 114 | `dona_aranha`, `aranha` |
| A Canoa Virou | 118 | `canoa` |
| Coelhinho da Páscoa | 96 | `coelho` |
| Pintinho Amarelinho | 148 | `pintinho` |
| O Sapo Não Lava o Pé | 138 | `sapo` |

## Personagens (11)

Boogar, Ceval, Dan, Esper, Gobu, Grompy, Ohle, Rafog, Teewong, Zoem e **Gerarda**.

Cada um tem um humanóide placeholder distinto (cor, proporção, cabeça e acessório).

**Gerarda não entra nestas 5 canções.** Ela já existe no elenco para capítulos futuros.

## Bandeja, balão e palco

- A bandeja inferior mostra **um círculo por personagem da canção**.
- A bandeja é **dinâmica e sem teto de 20 vagas**. Se a config tiver 21, 24 ou mais personagens, as bolinhas aparecem e rolam na horizontal.
- Toque no círculo abre um **balão amarelo** só com ícones de instrumento (sem texto).
- A criança **arrasta o instrumento** até o chão do palco (mouse e toque).
- Ao soltar: nasce o personagem 3D + o stem; **o instrumento some do balão**; o personagem **continua na bandeja**. Dá para clonar o mesmo personagem com instrumentos diferentes.
- Reposicionamento livre no chão. O volume cai com a distância até o ouvinte (centro-baixo da área do palco). Toque curto = mudo. Arrastar de volta à bandeja remove o clone e devolve o instrumento ao balão.
- O primeiro personagem no palco inicia o transporte em 0. Os seguintes entram sincronizados. Palco vazio para e zera o relógio.

## Áudio

- Web Audio API, sem `loop` nativo do arquivo.
- O ponto de volta é a grade musical: `bpm × compassos` em 4/4.
- Os stems têm **cauda** (reverb / decay) depois do ponto de loop — por isso o agendamento recomeça na grade enquanto a cauda do take anterior ainda soa.
- Cada stem é dirigido por config: personagem, instrumento, compassos, gênero e caminho do áudio.
- Placeholders gerados ficam em `public/audio/infanti_<canção>/` com o nome `{canção}_{gênero}_{instrumento}.ogg` para o drop-in dos arquivos reais do MEGA.

## Gamificação (v1)

- À esquerda: círculo, quadrado e triângulo, cada um com 4 fatias.
- Cada canção tem 3 combos de 4 instrumentos em `src/config/combos.json` (editável).
- Fatias enchem quando os instrumentos do combo estão no palco.
- 4/4 dispara um **prêmio placeholder** (presente visual). Sem economia persistente nesta versão.

## Câmera

Perspectiva ¾ (acima e à frente). Quem está mais longe no palco aparece menor.

## Fora deste recorte

- Retrato como layout principal
- Gerarda nas 5 canções atuais
- Modelos finais e stems MEGA (substituem os placeholders sem mudar código, se o nome bater)
