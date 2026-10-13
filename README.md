# Olha o Passarinho!

Jogo de fotografia de pássaros para duas telas, num único `index.html`. Não tem servidor nem Node: a TV e os celulares conversam direto pelo navegador (WebRTC).

## Como funciona

- Abrir o site é abrir a TV (host): céu, placar e QR Code.
- O QR leva ao mesmo site com `?sala=ABCD`, e o celular vira a câmera.
- O PeerJS (serviço gratuito) só apresenta TV e celular no começo. Depois, mira e disparos vão direto de um aparelho para o outro.

## Viagem pelo Brasil (fases)

- Quatro lugares: Mata Atlântica, Rio de Janeiro (Cristo e Pão de Açúcar), Sertão nordestino (mandacaru) e Amazônia (encontro das águas).
- Em cada lugar, o grupo tem 60 s para somar a meta de pontos. Bateu a meta, viaja para o próximo lugar e todo mundo ganha +8 fotos.
- Metas: 250, 350, 450 e 550 pontos, mais 120 por câmera extra (`STAGE_TARGETS` e `TARGET_PER_EXTRA_CAM` no `index.html`).
- Cada lugar tem os próprios pássaros e fica um pouco mais rápido que o anterior.
- Acabou o tempo ou o filme de todo mundo: a viagem termina ali.

## Regras da câmera instantânea

- Cada câmera começa com um pacote de 8 fotos, e cada disparo gasta uma.
- Cada **Foto Perfeita** ganha um pacote novo (+8).
- A foto sai pela fenda do celular e revela aos poucos. Sem filme, o obturador trava.
- Se todo mundo ficar sem filme, a rodada acaba antes do tempo.
- Para ajustar o tamanho do pacote, mude `FILM_START` e `FILM_BONUS` no `index.html`.

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `olha-o-passarinho`) com este `index.html` na raiz.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. No computador ligado à TV, abra `https://SEU-USUARIO.github.io/olha-o-passarinho/` e clique em **Preparar a TV**.

Também dá para colocar o `index.html` numa pasta de um site que já está publicado.

O GitHub Pages usa HTTPS, então o giroscópio funciona no celular.

## Atenção

- Abrir o arquivo direto no computador (`file://`) serve só para ver a TV. O celular precisa do site publicado.
- O serviço gratuito do PeerJS às vezes oscila. Se a TV mostrar "Sem conexão com o serviço de pareamento", espere alguns segundos ou recarregue.
- Na mesma Wi‑Fi a conexão abre mais rápido. Em redes muito fechadas (algumas corporativas ou 4G), a conexão direta pode não abrir.
- Ligue o **Modo Jogo** da TV para diminuir o atraso da imagem.

## Testar as regras

Abra o site com `?teste` no fim do endereço. A tela inicial mostra o resultado das 10 checagens de pontuação.
