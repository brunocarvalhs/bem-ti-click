# Bem Ti Click

O nome é um trocadilho com o bem-te-vi.

Jogo de fotografia de pássaros para duas telas, numa volta ao mundo que começa no Brasil. A TV mostra os pássaros e o celular vira a câmera. Feito em React + Vite, publicado como site estático: não tem servidor, e a TV conversa direto com os celulares pelo navegador (WebRTC).

## Como funciona

- Abrir o site é abrir a TV (host), com céu, placar e QR Code.
- O QR leva ao mesmo site com `?sala=ABCD`, e o celular vira a câmera.
- O PeerJS (serviço gratuito) só apresenta a TV e o celular no começo. Depois disso, mira e disparos vão direto de um aparelho para o outro.

## Mapa-múndi

No lobby, **Escolher no mapa** abre o mapa com o Brasil, o Peru, o Quênia, o Japão e a Austrália. Escolha o país, depois o lugar: a tela mostra os pássaros dele, com raridade e quanto vale cada foto. A viagem começa no lugar escolhido e segue pelos seguintes até a Austrália.

## Pausa

Durante o jogo, pause pelo botão **Pausa** da TV, pelas teclas **P** ou **Esc**, ou pelo botão **Pausar** do celular. A tela de pausa mostra:

- **Continuar**;
- o **catálogo de pássaros do país**, com os pontos de cada um e quais já foram fotografados na viagem;
- **Sair da viagem**, que volta para o lobby sem salvar no ranking.

O tempo e os pássaros ficam congelados enquanto o jogo está pausado.

## Níveis

O nível é escolhido no lobby da TV.

| Nível | Fotos |
|---|---|
| Fácil | Ilimitadas. |
| Normal | Pacote de 8. Foto Perfeita e lugar novo dão mais 8. |
| Difícil | O jogador escolhe o total da viagem inteira (3 a 40), sem filme novo. |

Sem filme, o obturador trava. Se todo mundo ficar sem filme, a viagem acaba ali.

## Volta ao mundo (fases)

São oito lugares, cada um com paisagem e pássaros típicos.

| # | Lugar | Paisagem | Pássaros |
|---|---|---|---|
| 1 | Mata Atlântica | Serra do Mar e palmeiras-juçara | bem-te-vi, sabiá, tucano, beija-flor, gavião-carijó |
| 2 | Rio de Janeiro | Cristo, Pão de Açúcar e calçadão | sabiá, bem-te-vi, beija-flor, tesourão |
| 3 | Sertão nordestino | Chapadas e mandacaru | asa-branca, carcará, galo-de-campina, beija-flor |
| 4 | Amazônia | Encontro das águas e sumaúmas | araras, tucano, gavião-real |
| 5 | Andes, Peru | Machu Picchu, terraços e lhamas | tico-tico, beija-flor-gigante, galo-da-serra, condor-andino |
| 6 | Savana, Quênia | Kilimanjaro, acácias e girafa | estorninho-soberbo, flamingo, rolieiro-de-peito-lilás, águia-pesqueira |
| 7 | Monte Fuji, Japão | Fuji, lago, torii e cerejeiras | mejiro, martim-pescador, faisão-verde, grou-japonês |
| 8 | Outback, Austrália | Uluru, eucaliptos e cangurus | periquito, cacatua-de-crista-amarela, cucaburra, cacatua-negra |

- Em cada lugar, o grupo tem 60 s para somar a meta de pontos.
- Metas: 250, 350, 450, 550, 650, 750, 850 e 1000 pontos, mais 120 por câmera extra (`STAGE_TARGETS` em `src/config.js`).
- Cada lugar é um pouco mais rápido que o anterior.

## Raridade

Cada espécie tem uma raridade. Quanto mais rara, menos aparece e mais vale a foto.

| Raridade | Multiplicador | Exemplos |
|---|---|---|
| Comum | ×1 | bem-te-vi, tico-tico, mejiro |
| Incomum | ×1,5 | tucano, flamingo, cacatua-de-crista-amarela |
| Rara | ×2 | arara-azul, galo-da-serra, cucaburra |
| Lendária | ×3 | gavião-real, condor-andino, grou-japonês |

A pontuação base é Foto Perfeita 100, Boa 50 e Tremida 10. Uma Foto Perfeita de ave lendária vale 300, e Perdeu o foco continua valendo 0. A TV e o celular mostram a raridade a cada acerto, e ela também sai na legenda da foto.

## Fim da viagem

- **TV**: placar da partida, ranking do nível e três botões: **Continuar jogando**, **Mudar nível ou destino** e **Conhecer outros projetos do Bruno** (raiz do site onde o jogo está publicado).
- **Celular**: mostra os pontos e a posição, mais **Continuar jogando** e o link para o site principal.

## Estrutura

```
index.html                 página base do Vite (só carrega src/main.jsx)
src/
  main.jsx                 rota: TV (padrão) ou câmera (?sala=ABCD), cada uma carregada sob demanda
  config.js                tudo que dá para ajustar: metas, filme, link do site, ranking, analytics
  core/rules.js            regras puras: pontuação, raridade, latência, níveis, filme, metas e checagens
  shared/                  util (localStorage, link do site…), audio (sons chiptune), net (PeerJS), analytics (GA4)
  art/                     pixel art feita por código: pixel, birds (28 espécies), mico, stages (8 lugares e países), worldmap
  ui/images.js             sprites e miniaturas prontas para <img>
  tv/engine/               motor da TV, sem React: game (fases, disparo, pausa, loop), state (estado + aviso de mudança),
                           room (sala PeerJS), flight (voo), render (canvas), ranking (Supabase ou local)
  tv/ui/                   telas da TV em React: TvApp (HUD), Gate, Lobby, WorldMap, BirdList, Screens (viagem, pausa, fim)
  camera/                  celular: CameraApp (React), link (conexão com a TV), aim (touchpad e giroscópio)
  styles/                  base.css, tv.css, camera.css
test/rules.test.js         as checagens das regras no terminal
.github/workflows/deploy.yml   testa, gera o build e publica no GitHub Pages
```

O jogo em si (canvas a 60 quadros por segundo) roda fora do React. O motor muda o estado e avisa; o React só redesenha as telas quando algo muda (placar, relógio, fase). Os módulos seguem um sentido só: `core` e `art` não conhecem a TV nem a câmera, e a TV e a câmera não se conhecem.

## Analytics (Google Analytics 4)

1. No Google Analytics, crie uma propriedade e um fluxo de dados **Web** com o endereço do jogo.
2. Copie o **ID da métrica** (`G-XXXXXXXXXX`).
3. Coloque o ID em `GA_ID` (`src/config.js`) ou crie a variável `VITE_GA_ID` em **Settings → Secrets and variables → Actions → Variables**.

Sem ID, nenhum dado sai do navegador. Eventos enviados (todos com `app_role` = `tv` ou `camera`):

| Evento | Quando | Parâmetros |
|---|---|---|
| `tv_ready`, `room_open` | TV preparada e sala criada | |
| `camera_joined` / `camera_join` | celular entrou (visto pela TV / pelo celular) | `cams` / `result` |
| `level_select` | nível escolhido | `level` |
| `map_open`, `destination_select` | mapa aberto e lugar escolhido | `place`, `country` |
| `game_start` | partida começou | `level`, `start_place`, `cams`, `hard_film` |
| `photo_taken` | cada foto | `result`, `rarity`, `species`, `place`, `points` |
| `stage_clear` | meta do lugar batida | `place`, `stage_number`, `level` |
| `game_pause`, `game_exit` | pausa e saída pela pausa | `place`, `from`, `level` |
| `game_end` | fim da viagem | `level`, `won`, `start_place`, `last_place`, `best_score`, `cams`, `species` |
| `play_again`, `portfolio_click` | continuar jogando e clique no link de projetos | `from` |
| `aim_mode` | giroscópio ativado no celular | `mode` |

Para ver os parâmetros nos relatórios, cadastre os que interessam em **Administrador → Definições personalizadas**. O nome dos jogadores nunca é enviado.

## Ranking público (Supabase)

Sem configuração, o ranking fica guardado só no navegador da TV, e o título mostra "Ranking desta TV". Para ter o ranking público:

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode:

```sql
create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 14),
  score int not null check (score between 1 and 20000),
  stage int not null check (stage between 1 and 8),
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
4. Coloque as duas em `src/config.js` (`RANK_URL` e `RANK_KEY`) ou nas variáveis `VITE_RANK_URL` e `VITE_RANK_KEY` do GitHub Actions.

Essa chave pode ficar no código: ela só permite o que as políticas acima liberam, que é ler o ranking e inserir pontuação. Nunca coloque a chave **secret** no site.

## Publicar no GitHub Pages

1. Uma vez só: em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
2. A cada push na `master`, o workflow `deploy.yml` roda os testes, gera o build e publica.
3. No computador ligado à TV, abra o endereço do Pages e clique em **Preparar a TV**.

O GitHub Pages usa HTTPS, então o giroscópio funciona no celular. O build usa caminhos relativos, então funciona em `usuario.github.io/bem-ti-click/` ou em qualquer domínio.

## Rodar no computador

Precisa de Node 22 ou mais novo.

```
npm install
npm run dev        # servidor de desenvolvimento
npm run build      # gera a pasta dist/
npm run preview    # serve o build
```

O celular só entra pelo site publicado (ou pelo IP do computador na mesma rede, sem giroscópio).

## Testar

- `npm test` roda as 16 checagens das regras no terminal.
- No navegador, abra o site com `?teste` no fim do endereço: a tela inicial mostra o resultado das checagens, e `window.oop` dá acesso ao estado da TV e à lista de eventos de analytics.

## Atenção

- **Ranking honesto**: qualquer pessoa pode enviar pontuação direto para a tabela. As regras do banco limitam nome, pontos, lugar e nível, mas não impedem um placar inventado. Se isso virar problema, dá para moderar pelo painel do Supabase.
- **Difícil**: o ranking é separado por nível, mas não pelo número de fotos escolhido, então um Difícil com 40 fotos conta igual a um com 5.
- **PeerJS**: o serviço gratuito às vezes oscila. Se a TV mostrar "Sem conexão com o serviço de pareamento", espere alguns segundos ou recarregue.
- **Rede**: na mesma Wi‑Fi a conexão abre mais rápido. Em redes muito fechadas (algumas corporativas ou 4G), a conexão direta pode não abrir.
- **TV**: ligue o Modo Jogo da TV para diminuir o atraso da imagem.
- **LGPD**: o GA4 usa cookies. Se o site tiver público grande, vale colocar um aviso de cookies com consentimento.
