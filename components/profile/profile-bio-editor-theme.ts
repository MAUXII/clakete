import type { EditorThemeClasses } from "lexical"

/** Minimal Lexical theme for profile bio only (not the full shadcn-editor kit). */
export const profileBioEditorTheme: EditorThemeClasses = {
  ltr: "text-left",
  rtl: "text-right",
  heading: {
    h1: "text-xl font-bold tracking-tight",
    h2: "text-lg font-semibold tracking-tight",
    h3: "text-base font-semibold",
    h4: "text-sm font-semibold",
    h5: "text-sm font-medium",
    h6: "text-sm font-medium",
  },
  paragraph: "leading-relaxed [&:not(:first-child)]:mt-3",
  quote: "border-l-2 border-l-[#FF0048]/45 pl-4 italic text-muted-foreground",
  link: "text-[#FF0048] hover:text-[#e60042] hover:underline cursor-pointer",
  list: {
    listitem: "my-1",
    nested: { listitem: "list-none" },
    ol: "m-0 list-decimal pl-6",
    ul: "m-0 list-disc pl-6",
    olDepth: [
      "list-decimal",
      "list-decimal",
      "list-decimal",
      "list-decimal",
      "list-decimal",
    ],
    ulDepth: ["list-disc", "list-disc", "list-disc", "list-disc", "list-disc"],
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-sm",
  },
}
