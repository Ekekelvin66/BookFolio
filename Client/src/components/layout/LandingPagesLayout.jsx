import { Outlet } from "react-router-dom"
import LandingNavbar from "./landingNavbar"
import LandingFooter from "./LandingFooter"

const LandingPageLayout = () => {
  return (
    <div className="landing-layout">
      <LandingNavbar />
      <main className="landing-main">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

export default LandingPageLayout