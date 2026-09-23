"use client";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "H2",
  "H3",
  "H4",
  "A",
  "HR",
  "SPAN",
]);

const ALLOWED_ATTRIBUTES: Record<string, string[]> = { A: ["href", "title"] };

/**
 * Allowlist sanitiser used only for the admin editor preview. The server
 * performs the authoritative sanitisation before anything is persisted.
 */
export function sanitizeHtmlForPreview(input: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      const allowed = ALLOWED_ATTRIBUTES[child.tagName] ?? [];
      for (const attribute of Array.from(child.attributes)) {
        if (!allowed.includes(attribute.name.toLowerCase())) {
          child.removeAttribute(attribute.name);
          continue;
        }
        if (attribute.name.toLowerCase() === "href") {
          const value = attribute.value.trim().toLowerCase();
          if (!/^(https?:|mailto:|tel:|\/)/.test(value)) {
            child.removeAttribute("href");
          }
        }
      }
      if (child.tagName === "A") {
        child.setAttribute("rel", "noopener noreferrer");
        child.setAttribute("target", "_blank");
      }
      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
}
