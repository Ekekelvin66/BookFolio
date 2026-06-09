import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Logo from '../ui/Logo'
import AppFooter from './AppFooter'

const footerColumns = [
  {
    heading: 'About',
    links: [
      { label: 'About Us', path: '/about' },
      { label: 'Contact Us', path: '/contact' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'Bestsellers', path: '/search?filter=bestsellers' },
      { label: 'New Releases', path: '/search?filter=new' },
      { label: 'Staff Picks', path: '/search?filter=staff-picks' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Join a Book Club', path: '/clubs' },
      { label: 'Reader Feed', path: '/home' },
      { label: 'Book Clubs', path: '/clubs' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Library Ethics', path: '/ethics' },
    ],
  },
]

const LandingFooter = ({ className }) => {
  return (
    <footer className={clsx('landing-footer', className)}>
      <div className="landing-footer__brand">
        <Logo className="landing-footer__logo" />
        <p className="landing-footer__tagline">The modern day digital library</p>
      </div>

      <div className="landing-footer__columns">
        {footerColumns.map((col) => (
          <div key={col.heading} className="landing-footer__col">
            <h4 className="landing-footer__col-heading">{col.heading}</h4>
            <ul className="landing-footer__col-links">
              {col.links.map((link) => (
                <li key={link.label}>
                  <NavLink to={link.path} className="landing-footer__link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <AppFooter />
    </footer>
  )
}

export default LandingFooter