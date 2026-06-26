import { useState } from 'react'
import { Outlet,useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AppFooter from './AppFooter'
import LandingFooter from './LandingFooter'

const AppLayout=()=> {
  const { user, logout } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate=useNavigate()

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  // const handleLogout=()=>{
  //   logout()
  //   navigate('/')
  // }

  const handleLogout = () => {
  const finished = logout()
  
  if (finished) {
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 0)
  }
}

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          className="app-layout__overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar
        user={user}
        onLogout={handleLogout}
        className={sidebarOpen ? 'sidebar--open' : ''}
      />

      <div className="app-layout__main">
        <Navbar
          user={user}
          onMenuClick={openSidebar}
        />
        <main className="app-layout__content">
          <Outlet />
        </main>
        <LandingFooter />
      </div>

    </div>
  )
}

export default AppLayout