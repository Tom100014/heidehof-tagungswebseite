import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  name: string;
  path: string;
}

export const Breadcrumb = ({ items }: { items: Crumb[] }) => {
  const all: Crumb[] = [{ name: "Start", path: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-6 py-4">
      <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-gold">
                  {c.name}
                </span>
              ) : (
                <Link to={c.path} className="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  {i === 0 && <Home className="w-3 h-3" />}
                  {c.name}
                </Link>
              )}
              {!last && <ChevronRight className="w-3 h-3 text-gold/40" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
