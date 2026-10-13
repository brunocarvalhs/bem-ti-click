# Olha o Passarinho!

Jogo de fotografia de pássaros brasileiros para duas telas. A TV mostra os pássaros e o celular vira a câmera. Não tem servidor nem build: o site é HTML, CSS e JavaScript em módulos, e a TV conversa direto com os celulares pelo navegador (WebRTC).

## Como funciona

- Abrir o site é abrir a TV (host), com céu, placar e QR Code.
- O QR leva ao mesmo site com `?sala=ABCD`, e o celular vira a câmera.
- O PeerJS (serviço gratuito) só apresenta a TV e o celular no começo. Depois disso, mira e disparos vão direto de um aparelho para o outro.

## Níveis

O nível é escolhido no lobby da TV.

| Nível | Fotos |
|---|---|
| Fácil | Ilimitadas. |
| Normal | Pacote de 8. Foto Perfeita e lugar novo dão mais 8. |
| Difícil | O jogador escolhe o total da viagem inteira (3 a 40), sem filme novo. |

Sem filme, o obturador trava. Se todo mundo ficar sem filme, a viagem acaba ali.

## Viagem pelo Brasil (fases)

- São quatro lugares: Mata Atlântica, Rio de Janeiro (Cristo e Pão de Açúcar), Sertão nordestino (mandacaru) e Amazônia (encontro das águas).
- Em cada lugar, o grupo tem 60 s para somar a meta de pontos.
- Metas: 250, 350, 450 e 550 pontos, mais 120 por câmera extra.
- Cada lugar tem os próprios pássaros e é um pouco mais rápido que o anterior.

## Fim da viagem

- **TV**: placar da partida, ranking do nível e três botões: **Continuar jogando**, **Mudar nível** e **Conhecer outros projetos do Bruno**.
- **Celular**: mostra os pontos e a posição, mais **Continuar jogando** e o link para o site principal.

## Estrutura

```
index.html              marcação da TV e da câmera; carrega as libs e js/main.js
css/
  base.css              cores, tipografia, botões e painéis
  tv.css                HUD, lobby (níveis), viagem e fim da viagem
  camera.css            visor, obturador, foto instantânea e folhas
js/
  main.js               rota: TV (padrão) ou câmera (?sala=ABCD)
  config.js             tudo que dá para ajustar: metas, filme, link do site, ranking
  core/rules.js         regras puras: pontuação, latência, níveis, filme, metas e checagens
  shared/util.js        ajudantes do navegador ($, clamp, localStorage…)
  shared/audio.js       sons chiptune sintetizados
  shared/net.js         opções e erros do PeerJS
  art/pixel.js          base da pixel art (grade → sprite, cantoneiras)
  art/birds.js          as 12 espécies e seus sprites
  art/mico.js           o Mico, que ri quando a foto sai fora de foco
  art/stages.js         os quatro lugares, as paisagens e as nuvens
  tv/host.js            fases, disparo, loop e botões da TV
  tv/state.js           estado compartilhado da TV
  tv/room.js            sala no PeerJS e conexões dos celulares
  tv/flight.js          voo dos pássaros
  tv/render.js          desenho da cena e recorte das fotos
  tv/hud.js             placar, lobby, resultados e ranking na tela
  tv/ranking.js         ranking (Supabase ou só neste navegador)
  camera/camera.js      entrar na sala, visor, obturador e tela final
  camera/aim.js         mira por touchpad ou giroscópio e ajustes
test/rules.test.js      as checagens das regras no terminal
```

Os módulos seguem um sentido só: `core` e `art` não conhecem a TV nem a câmera, e a TV e a câmera não se conhecem. A TV carrega só o código dela, e o celular também.

## Ranking público (Supabase)

Sem configuração, o ranking fica guardado só no navegador da TV, e o título mostra "Ranking desta TV". Para ter o ranking público:

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode:

```sql
create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 14),
  score int not null check (score between 1 and 20000),
  stage int not null check (stage between 1 and 4),
  level text not null check (level in ('facil', 'normal', 'dificil')),
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
create policy "todos leem o ranking" on public.scores for select using (true);
create policy "todos enviam pontuação" on public.scores for insert with check (true);
grant select, insert on public.scores to anon;
create index scores_level_score on public.scores (level, score desc);
```

3. Em **Project Settings → API Keys**, copie a **Project URL** e a chave **publishable** (`sb_publishable_…`). A chave **anon** antiga também funciona.
4. Cole as duas em `js/config.js`, em `RANK_URL` e `RANK_KEY`.

Essa chave pode ficar no código: ela só permite o que as políticas acima liberam, que é ler o ranking e inserir pontuação. Nunca coloque a chave **secret** no site.

## Publicar no GitHub Pages

1. Coloque estes arquivos na raiz do repositório.
2. Em **Settings → Pages**, escolha a branch `master` e a pasta `/ (root)`.
3. No computador ligado à TV, abra o endereço do Pages e clique em **Preparar a TV**.

O GitHub Pages usa HTTPS, então o giroscópio funciona no celular.

## Rodar no computador

Módulos não funcionam abrindo o arquivo direto (`file://`). Suba um servidor simples na pasta:

```
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`. O celular só entra pelo site publicado (ou pelo IP do computador na mesma rede, sem giroscópio).

## Testar

- No navegador, abra o site com `?teste` no fim do endereço. A tela inicial mostra o resultado das 13 checagens das regras.
- No terminal, rode `node test/rules.test.js` (Node 22 ou mais novo).

## Atenção

- **Ranking honesto**: qualquer pessoa pode enviar pontuação direto para a tabela. As regras do banco limitam nome, pontos, lugar e nível, mas não impedem um placar inventado. Se isso virar problema, dá para moderar pelo painel do Supabase.
- **Difícil**: o ranking é separado por nível, mas não pelo número de fotos escolhido, então um Difícil com 40 fotos conta igual a um com 5.
- **PeerJS**: o serviço gratuito às vezes oscila. Se a TV mostrar "Sem conexão com o serviço de pareamento", espere alguns segundos ou recarregue.
- **Rede**: na mesma Wi‑Fi a conexão abre mais rápido. Em redes muito fechadas (algumas corporativas ou 4G), a conexão direta pode não abrir.
- **TV**: ligue o Modo Jogo da TV para diminuir o atraso da imagem.
