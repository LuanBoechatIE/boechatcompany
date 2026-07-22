"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Save, Check } from "lucide-react";
import { updateMapaCanvas } from "../../../crm-actions";

export function MapaEditor({
  id,
  initialNodes,
  initialEdges,
}: {
  id: number;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges],
  );

  function addNode() {
    const label = window.prompt("Texto do nó:", "Ideia");
    if (label === null) return;
    const novo: Node = {
      id: `n_${Date.now()}`,
      position: {
        x: 120 + Math.random() * 240,
        y: 80 + Math.random() * 240,
      },
      data: { label: label || "Nó" },
    };
    setNodes((ns) => [...ns, novo]);
  }

  function onNodeDoubleClick(_: unknown, node: Node) {
    const atual =
      typeof node.data?.label === "string" ? node.data.label : "";
    const label = window.prompt("Editar texto do nó:", atual);
    if (label === null) return;
    setNodes((ns) =>
      ns.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n)),
    );
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    try {
      await updateMapaCanvas(
        id,
        nodes as unknown[],
        edges as unknown[],
      );
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={addNode}
          className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
        >
          <Plus className="h-4 w-4" />
          Adicionar nó
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {salvo ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {salvando ? "Salvando..." : salvo ? "Salvo" : "Salvar"}
        </button>
        <span className="text-xs text-gelo-dim">
          Duplo clique num nó pra editar. Arrasta das bordas pra conectar.
        </span>
      </div>

      <div className="h-[70vh] overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2c2340" gap={20} />
          <Controls />
          <MiniMap
            pannable
            className="!bg-ink-soft"
            nodeColor="#6d28d9"
            maskColor="rgba(23,18,33,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
