import React, { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { AiOutlineHome, AiOutlineProject } from "react-icons/ai"

const MENU = [
  { title: "Home", to: "/", logo: <AiOutlineHome className="h-6 w-6" /> },
  { title: "Projets", to: "/projects", logo: <AiOutlineProject className="h-6 w-6" /> }
]

const Navbar = () => {
  const location = useLocation()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const index = MENU.findIndex(e => location.pathname.startsWith(e.to))
    setSelected(index !== -1 ? index : 0)
  }, [location])

  return (
    <div className="h-screen bg-primary">
      <div className="flex flex-col gap-5 justify-between p-2 pl-4 pt-10">
        <div>
          {MENU.map((menu, index) => (
            <NavLink
              to={menu.to}
              key={menu.title}
              className={({ isActive }) => `w-full mb-3 px-3 py-3 rounded flex items-center ${isActive ? "bg-white text-primary" : "text-white hover:bg-white hover:text-primary"}`}
            >
              {menu.logo}
              <p className="text-sm font-semibold text-center ml-3">{menu.title}</p>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Navbar
