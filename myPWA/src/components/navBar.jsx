import { Link } from "react-router-dom"
import './navBar.css'
import moonDefault from '../assets/moonDefault.png'
import moonHover from '../assets/moonHover.png'
import sunDefault from '../assets/sunDefault.png'
import sunHover from '../assets/sunHover.png'
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

    const iconDisplay = () => {
        if (theme === 'light') {
            return isHover ? moonHover : moonDefault;
        } else {
            return isHover ? sunHover : sunDefault;
        }
    }

    return(
        <div className='navbar'>
            <div className = 'home'>
                <Link to = '/'>
                  <button>Home</button>
               </Link>
            </div>
            <div className = 'explore'>
                <Link to = '/explore'>
                    <button>Explore</button>
                </Link>
            </div>
        <img onClick={toggleMode} onMouseEnter={cursorHover} onMouseLeave={cursorNotHover} src={iconDisplay()} alt='' className = 'toggleMode'/>
        </div>
    )
}