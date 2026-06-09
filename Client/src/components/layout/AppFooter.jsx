import clsx from 'clsx'
import { FaTwitter, FaInstagram, FaFacebook, FaGoodreads } from 'react-icons/fa'
import Logo from '../ui/Logo'

const socialLinks = [
  { icon: FaTwitter, label: 'Twitter' },
  { icon: FaInstagram, label: 'Instagram' },
  { icon: FaFacebook, label: 'Facebook' },
  { icon: FaGoodreads, label: 'Goodreads' },
]

const AppFooter = ({ className }) => {
  return (
    <div className={clsx('landing-footer__bottom', className)}>
      <div className="landing-footer__bottom-left">
        <Logo  className="landing-footer__logo"/>
        <p className="landing-footer__copyright">
          © {new Date().getFullYear()} BookFolio. All rights reserved.
        </p>
        <p className="landing-footer__attribution">
          Book data provided by{' '}
          <a
            href="https://books.google.com"
            target="_blank"
            rel="noreferrer"
            className="landing-footer__attribution-link"
          >
            Google Books API
          </a>
        </p>
      </div>
      <div className="landing-footer__socials">
        {socialLinks.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="landing-footer__social-btn"
            aria-label={label}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default AppFooter