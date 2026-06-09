import { Outlet } from "react-router-dom"

const LandingLayout=()=>{
    return(
        <div className="landing-layout">
            <Outlet />
        </div>
    )
}
export default LandingLayout