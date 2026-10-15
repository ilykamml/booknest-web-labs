import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}
export function Button({ children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
}
interface BadgeProps {
  children: ReactNode;
}
export function Badge({ children }: BadgeProps) {
  return <span className="badge">{children}</span>;
}
interface SpinnerProps {
  label?: string;
}
export function Spinner({ label = 'Загружаем книги…' }: SpinnerProps) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
interface EmptyStateProps {
  title: string;
  message: string;
  onReset?: () => void;
}
export function EmptyState({ title, message, onReset }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {onReset && (
        <Button className="primary-button" onClick={onReset}>
          Вернуться к полкам
        </Button>
      )}
    </div>
  );
}
interface ErrorBoxProps {
  error: Error;
  onRetry: () => void;
}
export function ErrorBox({ error, onRetry }: ErrorBoxProps) {
  return (
    <div className="error-state" role="alert">
      <p>{error.message}</p>
      <Button className="primary-button" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
