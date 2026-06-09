import clsx from "clsx";
// import '../styles/components.css'

const Badge = ({
    children,
    variant='default',
    size='md',
    className=''
})=>{
    return (
        <span className={clsx(
            'badge',`badge--${variant}`,`badge--${size}`,className )}
        >{children}</span>
    )
}
export default Badge