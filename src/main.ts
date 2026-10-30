/*
 * ============================================================
 *  PONTO DE PARTIDA DO SITE
 * ============================================================
 * É o primeiro arquivo que roda. Ele:
 *  1. cria o aplicativo Vue a partir do componente principal (App.vue);
 *  2. liga o sistema de rotas (qual página abre em cada endereço);
 *  3. carrega os estilos globais;
 *  4. coloca tudo dentro da <div id="app"> que está no index.html.
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './routes'
import './style.css'

createApp(App).use(router).mount('#app')
