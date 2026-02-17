"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import type { BlockEditorProps } from "@/components/blocks/types";

export interface DocumentContent {
  paragraphs: string[];
  format?: {
    zoom?: number;
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    textType?: "normal";
    lineHeight?: number;
    align?: "left" | "center";
  };
}

interface DocumentBlockProps extends BlockEditorProps<DocumentContent> {
  editorStyle?: CSSProperties;
}

const A4_PAGE_HEIGHT = 1123;

export function DocumentBlock({ content, readOnly, onChange, editorStyle }: DocumentBlockProps): JSX.Element {
  const [pageCount, setPageCount] = useState(1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const value = useMemo(() => (content.paragraphs ?? []).join("\n"), [content.paragraphs]);

  function updateValue(nextValue: string): void {
    onChange({ ...content, paragraphs: nextValue.split("\n") });
  }

  function recalculatePageCount(): void {
    const mirror = mirrorRef.current;
    if (!mirror) return;
    const contentHeight = Math.max(1, mirror.scrollHeight);
    const nextPages = Math.max(1, Math.ceil(contentHeight / A4_PAGE_HEIGHT));
    setPageCount((current) => (current === nextPages ? current : nextPages));
  }

  useEffect(() => {
    recalculatePageCount();
  }, [value, editorStyle]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      recalculatePageCount();
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="pointer-events-none absolute left-0 top-0 w-full opacity-0">
        <div
          ref={mirrorRef}
          className="w-full whitespace-pre-wrap break-words px-20 py-[72px] text-[15px] leading-7"
          style={{ fontFamily: "Arial, Helvetica, sans-serif", ...editorStyle }}
        >
          {value.length > 0 ? value : " "}
        </div>
      </div>

      <div aria-hidden className="pointer-events-none">
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index} className="h-[1123px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)]" />
        ))}
      </div>

      <textarea
        value={value}
        readOnly={readOnly}
        onChange={(event) => updateValue(event.target.value)}
        className="absolute inset-0 h-full w-full resize-none overflow-hidden border-none bg-transparent px-20 py-[72px] text-[15px] leading-7 text-[#202124] outline-none"
        style={{ fontFamily: "Arial, Helvetica, sans-serif", ...editorStyle }}
        spellCheck
      />
    </div>
  );
}
