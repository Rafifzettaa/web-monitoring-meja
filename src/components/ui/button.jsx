export function Button({ children, className = "", variant, ...props }) {
  const base = "px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white";
  const danger = "bg-red-500 hover:bg-red-600";
  return (
    <button
      className={`${base} ${variant === "destructive" ? danger : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
