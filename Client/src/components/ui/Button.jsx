// import '../styles/components.css';
import clsx from 'clsx'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={clsx(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && 'btn--full', 
        isLoading && 'btn--loading',
       className
)}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : (
        <>
          {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
          <span className="btn__label">{children}</span>
          {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
