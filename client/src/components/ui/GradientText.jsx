export default function GradientText({ children, className = '' }) {
  return (
    <span className={`bg-gradient-to-r from-green-700 via-green-500 to-emerald-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
