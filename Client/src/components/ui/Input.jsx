import clsx from "clsx"
const Input=({
    type='text',
    onChange,
    leftIcon=null,
    rightIcon=null,
    id,
    fullWidth=false,
    error,
    disabled=false,
    className='',
    label,
    ...rest
})=>{
    return (
       <div className={clsx(
        'input-wrapper',
        error && 'input-error',
        fullWidth && 'input--full'
       )}>
        {label &&<label htmlFor={id} className="input__label">{label}</label>} 
        <div className="input__field-wrapper">
          {leftIcon && <span className="input__icon input__icon--left">{leftIcon}</span>}
          <input
            id={id}
            type={type}
            className={clsx('input-field',
                 leftIcon && 'input__field--left-icon',
                rightIcon && 'input__field-right-icon',className)}
            onChange={onChange}
            disabled={disabled}
            {...rest}
            />
        {rightIcon && <span className="input__icon input__icon--right">{rightIcon}</span>}
        </div>
        {error && <span className="input-error">{error}</span>}
       </div>
    )
}
export default Input