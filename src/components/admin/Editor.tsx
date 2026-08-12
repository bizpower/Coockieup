"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Editor degli articoli.
 *
 * Le stesse estensioni sono dichiarate anche nell'azione di salvataggio, dove
 * l'HTML viene rigenerato sul server: se le due liste divergessero, il testo
 * pubblicato non corrisponderebbe a quello scritto. Sono l'unica cosa da
 * tenere allineata fra i due file.
 */

const TOOLBAR_BUTTON =
  "rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-crema-deep disabled:opacity-40";

export function ArticleEditor({
  initialContent,
  onChange,
}: {
  initialContent: JSONContent;
  onChange: (doc: JSONContent) => void;
}) {
  const editor = useEditor({
    extensions: [
      // L'H1 è il titolo dell'articolo, che sta in un campo a parte: lasciarlo
      // disponibile qui produrrebbe pagine con due H1 e una gerarchia rotta.
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[24rem] w-full px-5 py-4 outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON()),
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Indirizzo del link", previous ?? "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const src = window.prompt("Indirizzo dell'immagine (es. /uploads/magazine/foto.jpg)");
    if (!src) return;

    // L'alt si chiede subito: rimandarlo significa non scriverlo mai.
    const alt = window.prompt("Testo alternativo — descrivi cosa si vede") ?? "";
    editor.chain().focus().setImage({ src, alt }).run();
  }, [editor]);

  const addVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Indirizzo del video YouTube o Vimeo");
    if (!url) return;

    const youtube = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    const vimeo = url.match(/vimeo\.com\/(\d+)/);

    const embed = youtube
      ? `https://www.youtube.com/embed/${youtube[1]}`
      : vimeo
        ? `https://player.vimeo.com/video/${vimeo[1]}`
        : null;

    if (!embed) {
      window.alert("Riconosciamo solo link di YouTube e Vimeo.");
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent(
        `<iframe src="${embed}" title="Video" allowfullscreen width="560" height="315"></iframe>`,
      )
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border-cacao-line bg-panna rounded-xl border p-5">
        <p className="text-cacao-soft text-sm">Preparo l&apos;editor…</p>
      </div>
    );
  }

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? "bg-cacao text-panna hover:bg-cacao" : "";

  return (
    <div className="border-cacao-line bg-panna overflow-hidden rounded-xl border">
      <div
        role="toolbar"
        aria-label="Formattazione"
        className="border-cacao-line bg-crema flex flex-wrap items-center gap-0.5 border-b px-3 py-2"
      >
        {([2, 3, 4] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={cn(TOOLBAR_BUTTON, active("heading", { level }))}
            aria-pressed={editor.isActive("heading", { level })}
          >
            H{level}
          </button>
        ))}

        <span className="bg-cacao-line mx-1.5 h-5 w-px" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(TOOLBAR_BUTTON, "font-extrabold", active("bold"))}
          aria-pressed={editor.isActive("bold")}
          aria-label="Grassetto"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(TOOLBAR_BUTTON, "italic", active("italic"))}
          aria-pressed={editor.isActive("italic")}
          aria-label="Corsivo"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(TOOLBAR_BUTTON, "line-through", active("strike"))}
          aria-pressed={editor.isActive("strike")}
          aria-label="Barrato"
        >
          S
        </button>

        <span className="bg-cacao-line mx-1.5 h-5 w-px" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(TOOLBAR_BUTTON, active("bulletList"))}
          aria-pressed={editor.isActive("bulletList")}
        >
          Elenco
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(TOOLBAR_BUTTON, active("orderedList"))}
          aria-pressed={editor.isActive("orderedList")}
        >
          Numerato
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(TOOLBAR_BUTTON, active("blockquote"))}
          aria-pressed={editor.isActive("blockquote")}
        >
          Citazione
        </button>

        <span className="bg-cacao-line mx-1.5 h-5 w-px" aria-hidden="true" />

        <button type="button" onClick={addLink} className={cn(TOOLBAR_BUTTON, active("link"))}>
          Link
        </button>
        <button type="button" onClick={addImage} className={TOOLBAR_BUTTON}>
          Immagine
        </button>
        <button type="button" onClick={addVideo} className={TOOLBAR_BUTTON}>
          Video
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className={TOOLBAR_BUTTON}
        >
          Tabella
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={TOOLBAR_BUTTON}
        >
          Separatore
        </button>

        <span className="ml-auto flex gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={TOOLBAR_BUTTON}
            aria-label="Annulla"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={TOOLBAR_BUTTON}
            aria-label="Ripeti"
          >
            ↪
          </button>
        </span>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
