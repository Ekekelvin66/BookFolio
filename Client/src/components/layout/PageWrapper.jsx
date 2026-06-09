import '../../styles/layout.css'
import clsx from 'clsx'
const PageWrapper = ({children,className=''})=>{

   return <div className={clsx(`page-wrapper`,className)}>{children}</div>
}
export default PageWrapper