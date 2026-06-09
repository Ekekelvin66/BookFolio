import clsx from "clsx";
import { CircleCheck, CircleX, TriangleAlert, Info, X } from 'lucide-react'
import { useEffect } from "react";

const Toast= ({
    message,
    type,
    onClose,
    duration=5000

})=>{

     const icons = {
    success: CircleCheck,
    error: CircleX,
    warning: TriangleAlert,
    info: Info
  }
  const Icon =icons[type]

    useEffect(()=>{
       const timer= setTimeout(()=>{
        onClose();
       },duration)
       return () => {
      clearTimeout(timer);
    
    };
    
  }, [onClose, duration]);


  return(
    <div className={clsx('toast__container',`toast-${type}`)}
    role='alert'
    aria-live="polite">
        {Icon && <Icon size={18} className="toast__icon" />}
        <p className="toast__text">{message}</p>
        <button className="toast__close" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
        </div>
  )
}
export default Toast