import { Link } from "react-router-dom"
import './navBar.css'
import moonDefault from '../assets/moonDefault.png'
import moonHover from '../assets/moonHover.png'
import sunDefault from '../assets/sunDefault.png'
import sunHover from '../assets/sunHover.png'
import homeLight from '../assets/homeLight.png'
import homeDark from '../assets/homeDark.png'
import { useState } from "react"

export function NavBar({theme, setTheme}) {

    const [isHover, setIsHover] = useState(false)

    const toggleMode = ()=>{
        theme == 'light' ? setTheme('dark') : setTheme('light');
    }

    const cursorHover = () => {
        setIsHover(true);
    }

    const cursorNotHover = () => {
        setIsHover(false);
    }

    const themeIconDisplay = () => {
        if (theme === 'light') {
            return isHover ? moonHover : moonDefault;
        } else {
            return isHover ? sunHover : sunDefault;
        }
    }

    const homeIconDisplay = () => {
        if (theme === 'light') {
            return homeLight;
        } else {
            return homeDark;
        }
    }  

    return(
        <div className='navbar'>
            <div className = 'home'>
                <Link to = '/'>
                  <img src={homeIconDisplay()} alt='Home' className = 'homeIcon'/>
               </Link>
            </div>
            <div className = 'explore'>
                <Link to = '/explore'>
                    <button>Explore</button>
                </Link>
            </div>
            <div className="themeToggle">
                <img onClick={toggleMode} onMouseEnter={cursorHover} onMouseLeave={cursorNotHover} src={themeIconDisplay()} alt='Toggle theme' className = 'themeIcon'/>
            </div>
        </div>
    )
}

