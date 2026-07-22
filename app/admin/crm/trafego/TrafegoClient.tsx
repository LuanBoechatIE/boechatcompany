"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, CircleCheck, CircleX, CircleDashed } from "lucide-react";
import { ClientePicker } from "./ClientePicker";
import { PeriodoPicker } from "./PeriodoPicker";
import { ReportPanel } from "./ReportPanel";
import {
  getTrafegoPainel,
  getLogoDataUrl,
  type ClienteTrafego,
  type TrafegoPainelResult,
} from "@/app/admin/trafego-actions";
import {
  rangeFromPreset,
  formatarRangeLabel,
  formatarIdCliente,
  nomeArquivo,
  type PresetKey,
  type Range,
} from "@/app/lib/trafego/periodo";

const STORAGE_KEY = "boechat_trafego_cliente";
type ExportState = "idle" | "processando" | "sucesso" | "erro";

function StatusChip({ status, label }: { status?: string; label: string }) {
  const ok = status === "ok";
  const erro = status === "erro";
  const Icon = ok ? CircleCheck : erro ? CircleX : CircleDashed;
  const cor = ok
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90"
    : erro
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-ink-line text-gelo-dim";
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${cor}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function TrafegoClient({
  clientes,
  boechatLogo,
}: {
  clientes: ClienteTrafego[];
  boechatLogo: string;
}) {
  const [selecionado, setSelecionado] = useState<ClienteTrafego | null>(null);
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [range, setRange] = useState<Range>(() => rangeFromPreset("30d"));
  const [painel, setPainel] = useState<TrafegoPainelResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [aviso, setAviso] = useState<string | null>(null);

  const reqId = useRef(0);
  const exportRef = useRef<HTMLDivElement>(null);

  // Restaura o cliente selecionado (persiste entre navegações).
  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const cli = clientes.find((c) => String(c.id) === salvo);
      if (cli) setSelecionado(cli);
    }
  }, [clientes]);

  // Carrega o painel sempre que cliente ou período mudam (ignora respostas
  // obsoletas pra evitar sobrescrita por requisição antiga).
  useEffect(() => {
    if (!selecionado) return;
    const id = ++reqId.current;
    setCarregando(true);
    getTrafegoPainel(selecionado.id, range.from, range.to)
      .then((res) => {
        if (id === reqId.current) setPainel(res);
      })
      .catch(() => {
        if (id === reqId.current)
          setPainel(null);
      })
      .finally(() => {
        if (id === reqId.current) setCarregando(false);
      });
  }, [selecionado, range.from, range.to]);

  // Converte a logo do cliente em data URL (evita CORS na exportação).
  useEffect(() => {
    setLogoData(null);
    if (!selecionado?.logo) return;
    let vivo = true;
    getLogoDataUrl(selecionado.logo).then((d) => {
      if (vivo) setLogoData(d);
    });
    return () => {
      vivo = false;
    };
  }, [selecionado]);

  const selecionarCliente = useCallback((c: ClienteTrafego) => {
    setSelecionado(c);
    localStorage.setItem(STORAGE_KEY, String(c.id));
  }, []);

  const mudarPeriodo = useCallback((p: PresetKey, r: Range) => {
    setPreset(p);
    setRange(r);
  }, []);

  async function exportar() {
    if (!selecionado || !painel || carregando || !exportRef.current) return;
    setExportState("processando");
    setAviso(null);
    try {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      // Deixa o layout/graficos assentarem antes do snapshot.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#171221",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = nomeArquivo(
        selecionado.nome,
        formatarIdCliente(selecionado.id),
        range.from,
        range.to,
      );
      link.href = dataUrl;
      link.click();
      setExportState("sucesso");
      setAviso("Imagem exportada com sucesso.");
    } catch (e) {
      setExportState("erro");
      setAviso(e instanceof Error ? e.message : "Falha ao gerar a imagem.");
    } finally {
      setTimeout(() => setExportState("idle"), 3000);
    }
  }

  const periodoLabel = formatarRangeLabel(range.from, range.to);
  const geradoEmLabel = new Date().toLocaleString("pt-BR");
  const podeExportar = !!selecionado && !!painel && !carregando;

  const reportProps = selecionado
    ? {
        clienteNome: selecionado.nome,
        clienteId: formatarIdCliente(selecionado.id),
        clienteLogo: logoData,
        boechatLogo,
        periodoLabel,
        geradoEmLabel,
        meta: painel?.meta ?? { status: "nao_configurado" as const },
        google: painel?.google ?? { status: "nao_configurado" as const },
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Barra de filtros (não entra na exportação) ───────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl uppercase">Tráfego</h1>
            <p className="text-sm text-gelo-dim">
              Desempenho de anúncios por cliente e período.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodoPicker preset={preset} range={range} onChange={mudarPeriodo} />
            <button
              type="button"
              onClick={exportar}
              disabled={!podeExportar || exportState === "processando"}
              className="flex items-center gap-2 rounded-xl bg-roxo px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {exportState === "processando" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando imagem…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Exportar painel
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ClientePicker
            clientes={clientes}
            selecionado={selecionado}
            onSelect={selecionarCliente}
            carregando={carregando}
          />
          {selecionado && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gelo-dim">
              <span>
                <strong className="text-gelo">{selecionado.nome}</strong> · ID{" "}
                {formatarIdCliente(selecionado.id)}
              </span>
              <StatusChip status={painel?.meta.status} label="Meta" />
              <StatusChip status={painel?.google.status} label="Google" />
              {painel?.ultimaSyncLabel && (
                <span>Última sync: {painel.ultimaSyncLabel}</span>
              )}
            </div>
          )}
        </div>

        {selecionado && (
          <p className="text-sm text-gelo-dim">
            <span className="text-gelo-dim/60">Período analisado: </span>
            <span className="text-gelo">{periodoLabel}</span>
          </p>
        )}

        {aviso && (
          <div
            className={`rounded-xl border px-4 py-2.5 text-sm ${
              exportState === "erro"
                ? "border-red-500/30 bg-red-500/5 text-red-200/90"
                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90"
            }`}
          >
            {aviso}
          </div>
        )}
      </div>

      {/* ── Painel visível ───────────────────────────────────────── */}
      {!selecionado ? (
        <div className="rounded-3xl border border-dashed border-ink-line bg-ink-soft/20 p-16 text-center text-sm text-gelo-dim">
          Selecione um cliente para visualizar o painel de tráfego.
        </div>
      ) : carregando && !painel ? (
        <div className="flex items-center justify-center rounded-3xl border border-ink-line bg-ink-soft/20 p-16 text-sm text-gelo-dim">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando painel…
        </div>
      ) : (
        reportProps && <ReportPanel {...reportProps} />
      )}

      {/* ── Clone off-screen em largura fixa, só pra exportação ──── */}
      {reportProps && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: "-100000px",
            top: 0,
            width: "1500px",
            pointerEvents: "none",
          }}
        >
          <div ref={exportRef} style={{ width: "1500px", background: "#171221" }}>
            <ReportPanel {...reportProps} exportMode />
          </div>
        </div>
      )}
    </div>
  );
}
