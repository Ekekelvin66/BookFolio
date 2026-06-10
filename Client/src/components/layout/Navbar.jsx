import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Menu, Search, X } from 'lucide-react';
import Avatar from "../ui/Avatar";
import clsx from 'clsx';
import { useNotificationContext } from "../../context/NotificationContext";
import BookSearchCombobox from "../ui/BookSearchbox";
import { useNavigate, useLocation } from "react-router-dom";
import GenreDropdown from "../ui/Genredropdown";


const HIDE_SEARCH = ['/messages', '/clubs', '/notifications', '/settings', '/reviews', '/books', '/search'];


const NavBar = ({ user, className, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileSearchOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldShowSearch = !HIDE_SEARCH.some(path => location.pathname.startsWith(path));
  const { unreadCount } = useNotificationContext();

  const handleSearch = (query) => {
    setIsMobileSearchOpen(false);
    navigate(
      `/search?query=${encodeURIComponent(query)}`
    );
  };


  return (
    <>
      <header className={clsx('navbar', className)}>
        <div className="navbar__left">
          <button
            className="navbar__hamburger"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {shouldShowSearch && (
            <button
              className="navbar__mobile-search-toggle"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              aria-label="Toggle search"
            >
              <Search size={20} />
            </button>
          )}
        </div>
        {shouldShowSearch && (
          <div className="navbar__desktop-search">
            <BookSearchCombobox placeholder='Search For books..' onSearchSubmit={handleSearch} />
          </div>
        )}
        <div className="navbar_desktop_dropdown">
          <GenreDropdown/>
        </div>
        <div className="nav__links">
          <NavLink
            to='/notifications'
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'nav-link--active')
            }
            aria-label="Notifications"
          ><Bell size={18} />
            {unreadCount > 0 && (
              <span className="navbar__notif-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to='/profile'
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'nav-link--active')
            }
            aria-label="Profile"
          ><Avatar name={user?.name} src={user?.image_url} size="sm" />
          </NavLink>
        </div>

      </header>
      {shouldShowSearch && isMobileSearchOpen && (
        <div className="navbar__mobile-search-row">
          <div className="navbar__mobile-search-inner">
            <BookSearchCombobox placeholder='Search For books..' onSearchSubmit={handleSearch} />
            <button onClick={() => setIsMobileSearchOpen(false)} className="navbar__mobile-search-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>

  )
}
export default NavBar;