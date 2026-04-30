"use client";

// FindIt — sideways branching tree showing Antithesis's fault-injection
// exploration. Each edge carries an injected fault; one path terminates at
// "✕ Bug Found". Layout is deterministic per bug id (seeded PRNG).

import { useEffect, useMemo, useRef, useState } from "react";

import type { PickerBug, PickerBugId } from "@/lib/picker-bugs";

const FAULTS = [
  "+5ms latency",
  "+10ms latency",
  "+25ms latency",
  "+50ms latency",
  "+100ms latency",
  "thread paused",
  "process hung",
  "process killed",
  "node throttled",
  "network congestion",
];

type Node = {
  id: number;
  depth: number;
  children: Node[];
  leafCount?: number;
  x: number;
  y: number;
};

type Edge = { from: Node; to: Node; fault: string; showLabel: boolean };

type Tree = {
  W: number;
  H: number;
  nodes: Node[];
  edges: Edge[];
  leaves: Node[];
  root: Node;
  foundLeaf: Node;
  pathEdges: Set<Edge>;
  pathLeaves: Set<number>;
};

function buildTree(bugId: string): Tree {
  const W = 1200;
  const H = 460;
  const PAD_L = 60;
  const PAD_R = 140;
  const PAD_T = 14;
  const PAD_B = 14;

  // Seeded PRNG so each bug gets a stable but different tree
  let seed = 0;
  for (let i = 0; i < bugId.length; i++) seed = (seed * 31 + bugId.charCodeAt(i)) >>> 0;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  }
  function randInt(lo: number, hi: number) {
    return lo + Math.floor(rand() * (hi - lo + 1));
  }
  function pickFault() {
    return FAULTS[Math.floor(rand() * FAULTS.length)];
  }

  const MAX_DEPTH = 3;
  const cols = [
    PAD_L,
    PAD_L + (W - PAD_L - PAD_R) * 0.26,
    PAD_L + (W - PAD_L - PAD_R) * 0.58,
    W - PAD_R,
  ];

  let nextId = 0;
  function makeNode(depth: number): Node {
    const node: Node = { id: nextId++, depth, children: [], x: 0, y: 0 };
    if (depth < MAX_DEPTH) {
      const fanout =
        depth === 0 ? randInt(3, 4) : depth === 1 ? randInt(2, 3) : randInt(2, 3);
      for (let i = 0; i < fanout; i++) {
        node.children.push(makeNode(depth + 1));
      }
    }
    return node;
  }
  const root = makeNode(0);

  function countLeaves(n: Node): number {
    if (n.children.length === 0) {
      n.leafCount = 1;
      return 1;
    }
    n.leafCount = n.children.reduce((s, c) => s + countLeaves(c), 0);
    return n.leafCount;
  }
  countLeaves(root);

  const usableH = H - PAD_T - PAD_B;
  function layout(node: Node, top: number, bottom: number) {
    node.x = cols[node.depth];
    node.y = (top + bottom) / 2;
    if (node.children.length === 0) return;
    let cursor = top;
    for (const child of node.children) {
      const slice = (bottom - top) * ((child.leafCount ?? 1) / (node.leafCount ?? 1));
      layout(child, cursor, cursor + slice);
      cursor += slice;
    }
  }
  layout(root, PAD_T, PAD_T + usableH);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const leaves: Node[] = [];
  function walk(node: Node) {
    nodes.push(node);
    if (node.children.length === 0) leaves.push(node);
    for (const c of node.children) {
      const showLabel = node.children.length > 1;
      edges.push({ from: node, to: c, fault: pickFault(), showLabel });
      walk(c);
    }
  }
  walk(root);

  const offsetMap: Record<PickerBugId, number> = {
    race: 0.42,
    deadlock: 0.61,
    ordering: 0.34,
    zombie: 0.72,
    cache: 0.18,
  };
  const off = offsetMap[bugId as PickerBugId] ?? 0.5;
  const foundLeaf = leaves[Math.min(leaves.length - 1, Math.floor(leaves.length * off))];

  const pathLeaves = new Set<number>([foundLeaf.id]);
  const pathEdges = new Set<Edge>();
  let cursor: Node | undefined = foundLeaf;
  while (cursor && cursor.id !== root.id) {
    const e = edges.find((ed) => ed.to.id === cursor!.id);
    if (!e) break;
    pathEdges.add(e);
    pathLeaves.add(e.from.id);
    cursor = e.from;
  }

  return { W, H, nodes, edges, leaves, root, foundLeaf, pathEdges, pathLeaves };
}

function edgePath(from: Node, to: Node) {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;
}

export function FindIt({ bug }: { bug: PickerBug }) {
  const tree = useMemo(() => buildTree(bug.id), [bug.id]);
  const { W, H, nodes, edges, foundLeaf, pathEdges } = tree;
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Animation: reveal edges in left→right wave by depth, then mark found.
  // Starts at -1 (nothing visible). Triggered when the stage scrolls into view.
  const [phase, setPhase] = useState(-1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setPhase(-1);
    setRunning(false);
  }, [bug.id]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let triggered = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    function startRun() {
      setRunning(true);
      setPhase(0);
      timers = [
        setTimeout(() => setPhase(1), 350),
        setTimeout(() => setPhase(2), 850),
        setTimeout(() => setPhase(3), 1400),
        setTimeout(() => setPhase(4), 2100),
        setTimeout(() => setPhase(5), 2700),
      ];
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.4 && !triggered) {
            triggered = true;
            startRun();
            obs.disconnect();
          }
        }
      },
      { threshold: [0, 0.25, 0.4, 0.6, 0.8] },
    );
    obs.observe(stage);
    return () => {
      obs.disconnect();
      for (const t of timers) clearTimeout(t);
    };
  }, [bug.id]);

  const edgeVisible = (e: Edge) => phase >= e.to.depth;
  const nodeVisible = (n: Node) => phase >= n.depth;

  return (
    <div className="findit fade-in">
      <div className="findit-stage" ref={stageRef}>
        {running && phase >= 0 && phase < 5 && (
          <div className="findit-running">
            <span className="findit-running-dot" />
            <span>Exploring branches…</span>
          </div>
        )}
        <svg
          className="findit-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="branchGrad"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={W}
              y2="0"
            >
              <stop offset="0%" stopColor="#917eff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f3affa" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient
              id="branchGradDim"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={W}
              y2="0"
            >
              <stop offset="0%" stopColor="#917eff" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f3affa" stopOpacity="0.30" />
            </linearGradient>
            <linearGradient
              id="branchGradFound"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={W}
              y2="0"
            >
              <stop offset="0%" stopColor="#917eff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.95" />
            </linearGradient>
            <filter id="foundGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="purpleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const visible = edgeVisible(e);
            const isPath = phase >= 4 && pathEdges.has(e);
            const isFoundEdge = isPath && e.to.id === foundLeaf.id;
            const stroke = isFoundEdge
              ? "url(#branchGradFound)"
              : isPath
                ? "url(#branchGrad)"
                : "url(#branchGradDim)";
            const sw = isFoundEdge ? 3.6 : isPath ? 3.0 : 2.0;
            return (
              <g
                key={i}
                className={"edge" + (visible ? " v" : "") + (isPath ? " p" : "")}
              >
                <path
                  d={edgePath(e.from, e.to)}
                  stroke={stroke}
                  strokeWidth={sw}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transitionDelay: e.to.depth * 220 + "ms" }}
                />
              </g>
            );
          })}

          {/* Edge labels (faults) — only on real branching edges */}
          {edges.map((e, i) => {
            const visible = edgeVisible(e);
            if (!visible || !e.showLabel) return null;
            const midX = (e.from.x + e.to.x) / 2;
            const mx = (midX + e.to.x) / 2;
            const my = e.to.y;
            const ny = my - 10;
            const isPath = phase >= 4 && pathEdges.has(e);
            const isFoundEdge = isPath && e.to.id === foundLeaf.id;
            return (
              <g
                key={"l" + i}
                className={"edge-label" + (visible ? " v" : "")}
                style={{ transitionDelay: e.to.depth * 220 + 100 + "ms" }}
              >
                <text
                  x={mx}
                  y={ny}
                  textAnchor="middle"
                  className={isFoundEdge ? "flbl found" : isPath ? "flbl on" : "flbl"}
                >
                  {e.fault}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const visible = nodeVisible(n);
            const isFound = phase >= 5 && n.id === foundLeaf.id;
            const isOnPath =
              phase >= 4 && tree.pathLeaves.has(n.id) && n.id !== foundLeaf.id;
            const isLeaf = n.children && n.children.length === 0;
            if (isLeaf && !isFound && !isOnPath) return null;
            const r = n.depth === 0 ? 8 : isLeaf ? 4.5 : 5;
            return (
              <g
                key={n.id}
                className={"node" + (visible ? " v" : "")}
                style={{ transitionDelay: n.depth * 220 + 50 + "ms" }}
              >
                {isFound && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={20}
                    fill="rgba(255,107,107,0.18)"
                    className="found-pulse"
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={
                    isFound
                      ? "#ff6b6b"
                      : isOnPath
                        ? "#f3affa"
                        : n.depth === 0
                          ? "#c9bfff"
                          : "#917eff"
                  }
                  opacity={isFound ? 1 : 0.95}
                  filter={
                    isFound
                      ? "url(#foundGlow)"
                      : n.depth === 0
                        ? "url(#purpleGlow)"
                        : undefined
                  }
                />
                {isFound && (
                  <foreignObject
                    x={n.x + 16}
                    y={n.y - 24}
                    width={210}
                    height={56}
                    style={{ overflow: "visible" }}
                  >
                    <div className="found-popup found-popup-static">
                      <div className="found-popup-title found-popup-title-lg">
                        <span className="found-popup-x">✕</span> Bug Found
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Root label */}
          {phase >= 0 && (
            <text
              x={tree.root.x - 14}
              y={tree.root.y + 5}
              textAnchor="end"
              className="root-lbl"
            >
              run
            </text>
          )}
        </svg>
      </div>

      <div className="findit-head">
        <div className="findit-stat">
          <span className="findit-stat-num">1.5M</span>
          <span className="findit-stat-lbl">paths explored</span>
        </div>
        <h2>
          Antithesis simulates your application environment and injects
          <span className="findit-em"> realistic production faults</span> until your
          <span className="findit-em"> {bug.name.toLowerCase()} bug</span> appears.
        </h2>
      </div>
    </div>
  );
}
