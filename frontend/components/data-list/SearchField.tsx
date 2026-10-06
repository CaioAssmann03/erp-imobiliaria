export function SearchField(props: React.ComponentProps<"input">) {
  return (
    <input
      type="search"
      className="h-10 w-full shrink-0 rounded-full bg-surface px-4 sm:h-9 sm:w-72 text-body shadow-card outline-none transition-shadow placeholder:text-ink-faint focus:ring-2 focus:ring-brand/50"
      {...props}
    />
  );
}
