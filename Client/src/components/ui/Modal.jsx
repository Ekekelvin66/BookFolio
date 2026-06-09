import clsx from "clsx";
import { useEffect } from "react";

const Modal=({
    isOpen=false,
    onClose,
    size='md',
    className='',
    title,
    children,
    ...rest
})=>{
    useEffect(()=>{
        const handleKeyDown=(e)=>{
            if(e.key==='Escape'){
                onClose();
            }
        }
        window.addEventListener('keydown',handleKeyDown)

        return ()=>{
            window.removeEventListener('keydown',handleKeyDown)
        }
    },[onClose])

    if(!isOpen) return null
    return(
        
        <div className={clsx('backdrop')} onClick={onClose}>
            <div 
            className={clsx('modal',`modal--${size}`,className)} 
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal='true'
            aria-labelledby='modal-title'
            {...rest}
        >
            <div className="modal__header">
             <h2 id='modal-title' className="modal__title">{title}</h2>
                <button className="modal__close" onClick={onClose} aria-label="Close modal">✕</button>
            </div>   
            <div className="modal__body">
                {children}
            </div>
        </div>
    </div>
            )
        }
export default Modal