import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RichMarkdownProps {
  content: string;
  className?: string;
}

const CodeBlock = ({ children, className }: { children: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "code";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative my-3 rounded-lg border border-gold/15 bg-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-gold/10 bg-background/40">
        <span>{lang}</span>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 hover:text-gold transition-colors"
          aria-label="Code kopieren"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "kopiert" : "kopieren"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-foreground/90">
        <code>{children}</code>
      </pre>
    </div>
  );
};

import { useNavigate } from "react-router-dom";

export const RichMarkdown = ({ content, className }: RichMarkdownProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none",
        "prose-p:my-1 prose-strong:text-gold prose-em:text-gold/80",
        "prose-li:my-0.5 prose-headings:font-serif prose-headings:text-foreground",
        "prose-a:text-gold prose-a:no-underline hover:prose-a:underline",
        "prose-table:text-xs prose-th:text-gold prose-th:border-gold/20 prose-td:border-gold/10",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) {
            const text = String(children ?? "").replace(/\n$/, "");
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-gold/10 text-gold font-mono text-[0.85em]" {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{text}</CodeBlock>;
          },
          a({ href, children, ...props }) {
            const isInternal = href && (href.startsWith("/") || href.startsWith(window.location.origin));
            
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (isInternal && href) {
                e.preventDefault();
                const path = href.startsWith("/") ? href : href.substring(window.location.origin.length);
                navigate(path);
                
                // Trigger smooth scroll / highlight if there's an anchor
                const hashIndex = path.indexOf("#");
                if (hashIndex !== -1) {
                  const routePath = path.substring(0, hashIndex);
                  const anchor = path.substring(hashIndex + 1);
                  window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
                    detail: { route: routePath || undefined, anchor }
                  }));
                } else {
                  window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
                    detail: { route: path }
                  }));
                }
              }
            };

            return (
              <a
                href={href}
                onClick={handleClick}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      >
        {content || "..."}
      </ReactMarkdown>
    </div>
  );
};
