// O PeerJS só faz o "aperto de mão" inicial pelo serviço gratuito dele; depois os dados vão direto entre TV e celular.
export { PEER_PREFIX } from '../config.js';

// window.OOP_PEER permite apontar para um PeerServer próprio (usado nos testes locais).
export const PEER_OPTS = Object.assign({ debug: 0 }, window.OOP_PEER || {});
export const NET_ERR = ['network', 'server-error', 'socket-error', 'socket-closed'];
