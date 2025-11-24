import { NavBar } from "./components/navBar"
import { Outlet } from "react-router-dom"
import { useState } from "react";

export function Layout(){

    const [theme, setTheme] = useState('light');

    return(
        <div className={`container ${theme}`}>
            <NavBar theme={theme} setTheme={setTheme}/>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}