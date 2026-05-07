import "@fontsource/anonymous-pro";

import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyle from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-light";

type CodeSnippetProps = { children: string };
export default function CodeSnippet({
  children,
}: CodeSnippetProps): React.ReactElement {
  return (
    <SyntaxHighlighter
      language="javascript"
      style={codeStyle}
      customStyle={{
        fontFamily: "Anonymous Pro",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      {children.trim()}
    </SyntaxHighlighter>
  );
}
