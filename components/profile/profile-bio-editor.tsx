"use client"

import { useEffect, useRef } from "react"
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TEXT_FORMAT_TRANSFORMERS,
  UNORDERED_LIST,
  HEADING,
} from "@lexical/markdown"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListItemNode, ListNode } from "@lexical/list"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { profileBioEditorTheme } from "@/components/profile/profile-bio-editor-theme"
import { cn } from "@/lib/utils"

const BIO_MARKDOWN_TRANSFORMERS = [
  ...TEXT_FORMAT_TRANSFORMERS,
  LINK,
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
]

const bioEditorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
]

function BioMarkdownInitPlugin({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    editor.update(() => {
      $convertFromMarkdownString(markdown || "", BIO_MARKDOWN_TRANSFORMERS, undefined, true)
    })
  }, [editor, markdown])
  return null
}

export function ProfileBioEditor({
  resetKey,
  markdown,
  onChange,
  placeholder = "Tell people about you…",
  className,
}: {
  resetKey: number
  markdown: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <LexicalComposer
      key={resetKey}
      initialConfig={{
        namespace: "ProfileBio",
        theme: profileBioEditorTheme,
        nodes: bioEditorNodes,
        onError: (e) => console.error(e),
      }}
    >
      <div
        className={cn(
          "relative min-h-[140px] rounded-md border border-border bg-muted/30 text-[15px] text-foreground",
          className,
        )}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="profile-bio-editor__input min-h-[120px] px-3 py-2.5 outline-none"
              aria-placeholder={placeholder}
              placeholder={
                <div className="pointer-events-none absolute left-3 top-2.5 select-none text-muted-foreground">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={BIO_MARKDOWN_TRANSFORMERS} />
        <BioMarkdownInitPlugin markdown={markdown} />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              onChange($convertToMarkdownString(BIO_MARKDOWN_TRANSFORMERS, undefined, true))
            })
          }}
        />
      </div>
    </LexicalComposer>
  )
}
