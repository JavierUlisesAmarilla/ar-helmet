import { createApp } from 'vue'
import Tres from '@tresjs/core'
import App from './App.vue'

import './assets/main.css'

export const app = createApp(App)

app.use(Tres)
app.mount('#app')