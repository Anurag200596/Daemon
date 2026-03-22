import { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";

export const getLanguageExtension = (filename: string): Extension => {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
      return javascript();

    case "jsx":
      return javascript({ jsx: true });

    case "ts":
      return javascript({ typescript: true });

    case "tsx":
      return javascript({ typescript: true, jsx: true });

    case "html":
      return html();

    case "css":
      return css();

    case "json":
      return json();

    case "md":
    case "mdx":
      return markdown();

    case "py":
      return python();

    // C / C++
    case "c":
    case "cpp":
    case "cc":
    case "cxx":
      return cpp();

    // Java
    case "java":
      return java();

    default:
      return [];
  }
};
