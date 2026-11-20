"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { getLanguage } from "@/lib/languages";
import { Skeleton } from "@/components/ui/skeleton";
import "./monaco-setup";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2 rounded-md border border-border bg-[#0d1117] p-4">
        <Skeleton className="h-4 w-2/3 bg-white/10" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
        <Skeleton className="h-4 w-1/3 bg-white/10" />
      </div>
    ),
  },
);

export function CodeEditor({
  problemId,
  language,
  value,
  onChange,
  height = 480,
}: {
  problemId: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const definition = getLanguage(language);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-[#0d1117]">
      <MonacoEditor
        height={height}
        language={definition.monaco}
        path={`${problemId}/${definition.extension}`}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        onChange={(next) => onChange(next ?? "")}
        loading={
          <div className="grid h-full min-h-48 place-items-center text-sm text-muted-foreground">
            Loading editor…
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 13.5,
          fontFamily:
            '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
          fontLigatures: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          bracketPairColorization: { enabled: true },
          wordWrap: "off",
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          contextmenu: false,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
}
