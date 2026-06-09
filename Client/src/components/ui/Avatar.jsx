import clsx from "clsx";
import { useState } from "react";
const Avatar=({
    src='',
    alt,
    name,
    size='sm',
    onClick,
    className='' 
})=>{
    const initials = name
    ? name.split(' ').map(v => v[0]).slice(0, 2).join('').toUpperCase()
    : ''
    
    const [imgError,setImgError]= useState(false)


    return(
        <div className={clsx('avatar-wrapper',`avatar-wrapper--${size}`,onClick && 'avatar--clickable',className)} onClick={onClick}>
            {src &&  !imgError ?
              (<img src={src} alt={alt} className="avatar__image" onError={()=>setImgError(true)}/>):
              (<span className="avatar__text">{initials}</span>)}
        </div>
    )
}
export default Avatar