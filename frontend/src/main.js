import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { restoreSession } from './lib/state/authState.svelte.js'

// Re-verify a stored Supabase session (if any) before the app starts reacting to it.
restoreSession()

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
