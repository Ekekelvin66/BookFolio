import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Home,
  LogOut,
  Users2,
  BookMarked,
} from 'lucide-react'
import clsx from 'clsx'
import Avatar from '../ui/Avatar'


const navGroups = [
  {
    label: 'Library',
    links: [
      { label: 'Home', path: '/home', icon: Home },
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Shelf', path: '/shelves', icon: BookMarked },
    ],
  },
  {
    label: 'Community',
    links: [
      {label:'Editors Picks',path:'/editors-picks',icon:BookOpen},
      { label: 'Messages', path: '/messages', icon: MessageSquare },
      {label:'Book Clubs',path:'/clubs',icon: Users2}
    ],
  },
]

const Sidebar=({ user, onLogout, className })=>{
  console.log('Icons are:', { BookOpen });
  return (
    <aside className={clsx('sidebar', className)}>

     
      <div className="sidebar__brand">
        <NavLink to="/home" className="sidebar__logo">
          <BookOpen size={20} className="sidebar__logo-icon" />
          <span className="sidebar__logo-text">BookFolio</span>
        </NavLink>
        <p className="sidebar__tagline">Modern Reader</p>
      </div>


      <nav className="sidebar__nav">
        {navGroups.map((group) => (
          <div key={group.label} className="sidebar__group">
            <span className="sidebar__group-label">{group.label}</span>
            {group.links.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    clsx('sidebar__link', isActive && 'sidebar__link--active')
                  }
                >
                  <Icon size={16} className="sidebar__link-icon" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      
      <div className="sidebar__user">
        <NavLink
          to="/profile"
          className="sidebar__user-info"
        >
          <Avatar
            src={user?.image_url}
            name={user?.name}
            color={user?.avatar_color}
            size="sm"
          />
          <div className="sidebar__user-text">
            <p className="sidebar__user-name">
              {user?.username?`@${user.username}`: user?.name}
            </p>
            <p className="sidebar__user-role">Reader</p>
          </div>
        </NavLink>
        <button
          className="sidebar__logout"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
