import './app.css'
import { Home } from './pages/home'
import { Results } from './pages/results'
import { Details } from './pages/details'
import { Explore } from './pages/explore'
import { Layout } from './layout'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MusicPlayer } from './components/musicPlayer'

function  App() {

return (
		<Router>
			<Routes>
				<Route element={<Layout/>}>
					<Route path = "/" element={<Home/>}/>
					<Route path = "/explore" element={<Explore/>}/>
					<Route path = "/results" element={<Results/>}/>
					<Route path = "/details" element={<Details/>}/>
				</Route>
			</Routes>
		<div>
			<MusicPlayer/>
		</div>
		</Router>
	)
}

export  default  App