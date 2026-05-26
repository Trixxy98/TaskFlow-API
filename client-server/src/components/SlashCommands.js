import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import SlashCommandsList from "./SlashCommandsList.jsx";

const COMMANDS = [
  { title: "Heading 1", description: "Tajuk besar", icon: "H1", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run() },
  { title: "Heading 2", description: "Tajuk sederhana", icon: "H2", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run() },
  { title: "Heading 3", description: "Tajuk kecil", icon: "H3", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run() },
  { title: "Bullet List", description: "Senarai bertanda", icon: "•", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: "Numbered List", description: "Senarai bernombor", icon: "1.", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  { title: "Blockquote", description: "Petikan teks", icon: "❝", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  { title: "Code Block", description: "Blok kod", icon: "</>", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  { title: "Divider", description: "Garis pemisah", icon: "—", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
  { title: "Bold", description: "Teks tebal", icon: "B", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBold().run() },
  { title: "Italic", description: "Teks condong", icon: "I", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleItalic().run() },
];

export default Extension.create({
  name: "slashCommands",
  addOptions() {
    return { suggestion: { char: "/", command: ({ editor, range, props }) => props.command({ editor, range }) } };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => COMMANDS.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8),
        render: () => {
          let component;
          let popup;
          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandsList, { props, editor: props.editor });
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate: (props) => {
              component.updateProps(props);
              popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") { popup[0].hide(); return true; }
              return component.ref?.onKeyDown(props);
            },
            onExit: () => {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});