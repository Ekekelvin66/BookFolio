import { NavLink } from "react-router-dom";
import {Bell,Menu} from 'lucide-react'
import Avatar from "../ui/Avatar";
import clsx from 'clsx'
import { useNotificationContext } from "../../context/NotificationContext";
import BookSearchCombobox from "../ui/BookSearchbox";
import { useNavigate,useLocation } from "react-router-dom";
import GenreDropdown from "../ui/Genredropdown";


const HIDE_SEARCH = ['/messages','/clubs', '/notifications', '/settings', '/reviews','/books','/search']


 

const NavBar = ({user,className,onMenuClick})=>{
   const location = useLocation();
   const navigate= useNavigate();
   const shouldShowSearch = !HIDE_SEARCH.some(path => location.pathname.startsWith(path))
   const {unreadCount} = useNotificationContext()

    const handleSearch = (query) => {
    navigate(
      `/search?query=${encodeURIComponent(query)}`
    );
  };

   
   return(

    <header className={clsx('navbar',className)}>
        <div className="navbar__left">
        <button
          className="navbar__hamburger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        </div>
        {shouldShowSearch && (
        <>
         <BookSearchCombobox placeholder='Search For books..' onSearchSubmit={handleSearch}/>
         <GenreDropdown/>
        </>
          )}
        <div className="nav__links">
            <NavLink
               to='/notifications'
               className={({isActive})=>
                  clsx('nav-link', isActive && 'nav-link--active')
            } 
                 aria-label="Notifications"  
                ><Bell size={18}/>
                {unreadCount>0 && (
                  <span className="navbar__notif-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
            </NavLink>
            <NavLink
               to='/profile'
               className={({isActive})=>
                  clsx('nav-link', isActive && 'nav-link--active')
            } 
            aria-label="Profile"
                ><Avatar name={user?.name} src={user?.image_url} size="sm"/>
            </NavLink>
        </div>
  
    </header>

   )
}
export default NavBar