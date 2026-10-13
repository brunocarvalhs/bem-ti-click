// Ajustes do jogo. Dá para mudar tudo aqui sem mexer no resto do código.
// Valores marcados com VITE_ também podem vir de variáveis no build (ex.: variáveis do repositório no GitHub Actions).
const env = (key, fallback) => (import.meta.env && import.meta.env[key]) || fallback;

// Mundo lógico da TV (a cena é desenhada em 320×180 e ampliada).
export const W = 1600, H = 900;

// Tempo de cada lugar e contagem antes de começar (segundos).
export const ROUND = 60, COUNTDOWN = 3;

// Meta de pontos de cada lugar (Brasil, depois o mundo), mais um tanto por câmera extra.
export const STAGE_TARGETS = [250, 350, 450, 550, 650, 750, 850, 1000];
export const TARGET_PER_EXTRA_CAM = 120;

// Filme: pacote do nível Normal e faixa de fotos que o Difícil aceita.
export const FILM_PACK = 8;
export const HARD_FILM = { min: 3, max: 40, def: 15 };

// Conexão.
export const MAX_CAMS = 6;
export const PEER_PREFIX = 'olhaopassarinho-v1-';
export const COLORS = ['#ffcc33', '#4cc9f0', '#ff6b9a', '#7bd389', '#ff8b3d', '#c4a8ff'];

// Tela final. Vazio = raiz do domínio onde o jogo está publicado (ex.: https://brunocarvalhs.github.io/).
export const PORTFOLIO_URL = env('VITE_PORTFOLIO_URL', '');

// Ranking público (Supabase). Vazio = ranking guardado só neste navegador. Passo a passo no README.
export const RANK_URL = env('VITE_RANK_URL', '');
export const RANK_KEY = env('VITE_RANK_KEY', '');

// Google Analytics 4 (ID no formato G-XXXXXXXXXX). Vazio = sem analytics.
export const GA_ID = env('VITE_GA_ID', '');
