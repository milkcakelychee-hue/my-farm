import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)
if (import.meta.env.PROD) import('./update.ts')
