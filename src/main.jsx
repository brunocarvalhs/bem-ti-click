// Rota: o site é sempre a TV (host); com ?sala=ABCD vira a câmera do celular.
// Cada lado carrega só o código que usa.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';

const params = new URLSearchParams(location.search);
const root = createRoot(document.getElementById('root'));
const load = params.has('sala') ? import('./camera/CameraApp.jsx') : import('./tv/ui/TvApp.jsx');

load.then(({ default: App }) => root.render(<StrictMode><App params={params} /></StrictMode>));
