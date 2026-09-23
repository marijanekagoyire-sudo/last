export function SearchForm({
  action,
  placeholder,
  defaultValue,
  hidden = {},
  label = "Search",
}: {
  action: string;
  placeholder: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
  label?: string;
}) {
  return (
    <form action={action} method="get" role="search" className="flex w-full max-w-md gap-2">
      {Object.entries(hidden).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <label htmlFor={`search-${action.replace(/\W/g, "")}`} className="sr-only">
        {label}
      </label>
      <input
        id={`search-${action.replace(/\W/g, "")}`}
        type="search"
        name="search"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light"
      >
        Search
      </button>
    </form>
  );
}
