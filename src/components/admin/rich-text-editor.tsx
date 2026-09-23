"use client";

import { useMemo, useRef, useState } from "react";
import { sanitizeHtmlForPreview } from "@/lib/sanitize-client";

type Tool = { label: string; title: string; open: string; close: string };

const TOOLS: Tool[] = [
  { label: "P", title: "Paragraph", open: "<p>", close: "</p>" },
  { label: "H2", title: "Heading level 2", open: "<h2>", close: "</h2>" },
  { label: "H3", title: "Heading level 3", open: "<h3>", close: "</h3>" },
  { label: "B", title: "Bold", open: "<strong>", close: "</strong>" },
  { label: "I", title: "Italic", open: "<em>", close: "</em>" },
  { label: "•", title: "Bullet list item", open: "<ul><li>", close: "</li></ul>" },
  { label: "1.", title: "Numbered list item", open: "<ol><li>", close: "</li></ol>" },
  { label: "❝", title: "Quote", open: "<blockquote>", close: "</blockquote>" },
];

export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const previewHtml = useMemo(() => (preview ? sanitizeHtmlForPreview(value) : ""), [preview, value]);

  function applyTool(tool: Tool) {
    const element = textareaRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = value.slice(start, end) || "text";
    const next = `${value.slice(0, start)}${tool.open}${selected}${tool.close}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + tool.open.length + selected.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div
      className={`mt-1 rounded-md border ${invalid ? "border-red-400" : "border-slate-300"} bg-white`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onClick={() => applyTool(tool)}
            className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand"
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          aria-pressed={preview}
          className="ml-auto rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div
          className="rich-text min-h-[12rem] px-3 py-3 text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <textarea
          id={id}
          ref={textareaRef}
          rows={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="w-full resize-y rounded-b-md px-3 py-2 font-mono text-sm text-ink focus:outline-none"
          placeholder="<p>Write the announcement here…</p>"
        />
      )}

      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
        Basic formatting tags are allowed. All content is sanitised on the server before it is
        saved or displayed.
      </p>
    </div>
  );
}
