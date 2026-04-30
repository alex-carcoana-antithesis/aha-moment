"use client";

import { useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bug } from "lucide-react";

import { PICKER_BUGS, type PickerBug } from "@/lib/picker-bugs";

const BUG_TAGS = [
  "Web apps",
  "Fintech",
  "Blockchain",
  "Databases",
  "Cloud infrastructure",
] as const;
type BugTag = (typeof BUG_TAGS)[number];

function Picker() {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState<BugTag>(BUG_TAGS[0]);

  const handleMove = (e: ReactMouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  };

  return (
    <div className="fade-in flex flex-col gap-4">
      <header className="flex flex-row items-center gap-8">
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-7xl font-bold leading-[1.05] tracking-tight">
            What&rsquo;s your favorite bug?
          </h2>
          <h3 className="text-lg text-muted-foreground">
            We&rsquo;ll show you how to find it and fix it in Antithesis.
          </h3>
        </div>
      </header>
      <p className="sub"></p>
      <div className="tag-tabs" role="tablist">
        {BUG_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === activeTag}
            className={`tag-tab${t === activeTag ? " is-active" : ""}`}
            onClick={() => setActiveTag(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="cards">
        {PICKER_BUGS.map((b) => (
          <Link
            key={b.id}
            href={`/sandbox/${b.id}`}
            className="card"
            onMouseMove={handleMove}
            onMouseEnter={() => router.prefetch(`/sandbox/${b.id}`)}
          >
            <div className="card-meta">
              <span className="card-chip">{b.name}</span>
              <span className="card-arrow" aria-hidden>
                →
              </span>
            </div>
            <p className="sub-line">{b.descriptions[activeTag]}</p>
            <Bug className="card-bug" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BugPickerView() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "0",
          right: "-100px",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.35,
        }}
        aria-hidden="true"
      >
        <Image
          src="/sad.png"
          alt=""
          width={500}
          height={500}
          className="h-auto"
          style={{ width: "900px" }}
          priority={false}
        />
      </div>
      <div className="picker-shell">
        <div className="picker-root">
          <Picker />
        </div>
      </div>
    </>
  );
}

export type { PickerBug };
