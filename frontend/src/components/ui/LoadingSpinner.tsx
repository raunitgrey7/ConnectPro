export default function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-3 border-surface-container-high border-t-primary rounded-full animate-spin" />
    </div>
  );
}
