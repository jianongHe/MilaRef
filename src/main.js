import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const svgIcons = import.meta.glob('./assets/icons/*.svg', { eager: true, as: 'raw' });

const app = createApp(App)
app.config.globalProperties.$svgIcons = svgIcons;

app.mount('#app')
