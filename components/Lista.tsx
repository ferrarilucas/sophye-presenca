"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Rsvp } from "@/lib/data";
import { sair } from "@/app/actions";
import { Ornament } from "./Ornament";

type Aba = "sim" | "nao";
type Modo = "grupos" | "az";
const LOTE: Record<Modo, number> = { grupos: 10, az: 30 };
type Grupo = { id: string; quando: string; pessoas: Rsvp[]; mensagem: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const quando = (iso: string) => fmt.format(new Date(iso)).replace(",", " às");

function agrupar(rows: Rsvp[]): Grupo[] {
  const map = new Map<string, Rsvp[]>();
  for (const r of rows) map.set(r.grupo, [...(map.get(r.grupo) ?? []), r]);
  return [...map.entries()]
    .map(([id, ps]) => {
      ps.sort((a, b) => Number(b.titular) - Number(a.titular));
      return { id, pessoas: ps, quando: ps[0].created_at, mensagem: ps.find((p) => p.mensagem)?.mensagem ?? null };
    })
    .sort((a, b) => b.quando.localeCompare(a.quando));
}

function baixarCsv(rows: Rsvp[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const linhas = [["Nome", "Resposta", "Tipo", "Recado", "Data"].join(";")];
  for (const g of agrupar(rows))
    for (const p of g.pessoas)
      linhas.push([esc(p.nome), p.vai ? "Vai" : "Não vai", p.titular ? "Titular" : "Acompanhante", esc(p.mensagem ?? ""), quando(p.created_at)].join(";"));
  const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "convidados-sophye.csv" });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Lista({ rows }: { rows: Rsvp[] }) {
  const router = useRouter();
  const [atualizando, startTransition] = useTransition();
  const [aba, setAba] = useState<Aba>("sim");
  const [modo, setModo] = useState<Modo>("grupos");
  const [busca, setBusca] = useState("");
  const [soRecados, setSoRecados] = useState(false);
  const [visiveis, setVisiveis] = useState(LOTE.grupos);
  const sentinela = useRef<HTMLDivElement>(null);

  const sim = useMemo(() => rows.filter((r) => r.vai), [rows]);
  const nao = useMemo(() => rows.filter((r) => !r.vai), [rows]);
  const respostas = useMemo(() => new Set(rows.map((r) => r.grupo)).size, [rows]);
  const recados = useMemo(() => rows.filter((r) => r.mensagem).length, [rows]);

  const atual = aba === "sim" ? sim : nao;
  const recadosAba = atual.filter((r) => r.mensagem).length;
  const q = norm(busca.trim());
  const filtradas = useMemo(() => {
    let rs = soRecados ? atual.filter((r) => r.mensagem) : atual;
    if (q) rs = rs.filter((r) => norm(r.nome).includes(q) || norm(r.mensagem ?? "").includes(q));
    return rs;
  }, [atual, soRecados, q]);
  // na visão por grupo, mostra o grupo inteiro de quem passou nos filtros
  const grupos = useMemo(() => {
    const ids = new Set(filtradas.map((r) => r.grupo));
    return agrupar(atual.filter((r) => ids.has(r.grupo)));
  }, [filtradas, atual]);
  const az = useMemo(() => [...filtradas].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [filtradas]);

  const total = modo === "grupos" ? grupos.length : az.length;
  const lote = LOTE[modo];
  const temMais = visiveis < total;

  // qualquer mudança de filtro recomeça o feed do início
  useEffect(() => setVisiveis(LOTE[modo]), [aba, modo, q, soRecados]);

  // scroll infinito: quando o fim da lista chega perto da tela, mostra o próximo lote
  useEffect(() => {
    const el = sentinela.current;
    if (!el || !temMais) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisiveis((v) => v + lote), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [temMais, lote, visiveis]);

  return (
    <main className="page lista">
      <img className="lis-corner tl" src="/lirios-rosa.webp" alt="" aria-hidden />
      <img className="garland g1" src="/arranjo.webp" alt="" aria-hidden />

      <header className="topo">
        <img className="mono sm" src="/monograma.png" alt="Monograma SA" />
        <h1 className="script gold-text">Lista de Convidados</h1>
        <p className="xv">XV ANOS · SOPHYE</p>
        <Ornament />
      </header>

      <section className="stats">
        <div className="stat"><b>{sim.length}</b><small>confirmados</small></div>
        <div className="stat"><b>{nao.length}</b><small>não vão</small></div>
        <div className="stat"><b>{respostas}</b><small>respostas</small></div>
      </section>
      {recados > 0 && <p className="sub">💌 {recados} {recados === 1 ? "recado carinhoso" : "recados carinhosos"} para a Sophye</p>}

      <div className="choice tabs" role="tablist">
        <button role="tab" aria-selected={aba === "sim"} className={aba === "sim" ? "on" : ""} onClick={() => setAba("sim")}>Confirmados · {sim.length}</button>
        <button role="tab" aria-selected={aba === "nao"} className={aba === "nao" ? "on" : ""} onClick={() => setAba("nao")}>Não poderão · {nao.length}</button>
      </div>

      <div className="tools">
        <label className="field search">
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome ou recado…" aria-label="Buscar" />
        </label>
        <div className="seg" role="group" aria-label="Visualização">
          <button className={modo === "grupos" ? "on" : ""} onClick={() => setModo("grupos")}>Grupos</button>
          <button className={modo === "az" ? "on" : ""} onClick={() => setModo("az")}>A–Z</button>
        </div>
      </div>

      <div className="filtros">
        <button className={`chip ${soRecados ? "on" : ""}`} aria-pressed={soRecados} onClick={() => setSoRecados(!soRecados)}>
          💌 Só com recados · {recadosAba}
        </button>
        {total > 0 && <span className="contagem">{total} {modo === "grupos" ? (total === 1 ? "resposta" : "respostas") : (total === 1 ? "pessoa" : "pessoas")}</span>}
      </div>

      {filtradas.length === 0 ? (
        <p className="vazio">
          {q ? "Ninguém encontrado com esse nome."
            : soRecados ? "Nenhum recado por aqui ainda 💗"
            : aba === "sim" ? "Ainda sem confirmações. Logo, logo chegam 💗" : "Ninguém recusou até agora 🥰"}
        </p>
      ) : modo === "grupos" ? (
        <ul className="grupos" key={aba + modo}>
          {grupos.slice(0, visiveis).map((g, i) => (
            <li key={g.id} className={`card ${aba}`} style={{ animationDelay: `${(i % lote) * 0.05}s` }}>
              <div className="card-head">
                <span className="titular">{g.pessoas[0].nome}</span>
                {g.pessoas.length > 1 && <span className="pill">{g.pessoas.length} pessoas</span>}
              </div>
              {g.pessoas.length > 1 && (
                <ul className="acomp">
                  {g.pessoas.slice(1).map((p) => <li key={p.id}>{p.nome}</li>)}
                </ul>
              )}
              {g.mensagem && <blockquote>“{g.mensagem}”</blockquote>}
              <time dateTime={g.quando}>{quando(g.quando)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <ol className="az" key={aba + modo}>
          {az.slice(0, visiveis).map((p, i) => (
            <li key={p.id}>
              <span className="num">{i + 1}</span>
              <div className="az-nome">
                <span>{p.nome}</span>
                {soRecados && p.mensagem && <em>“{p.mensagem}”</em>}
              </div>
              {!p.titular && <small>acompanhante</small>}
            </li>
          ))}
        </ol>
      )}

      {total > 0 && (temMais
        ? <div ref={sentinela} className="carregando" aria-hidden><Ornament /></div>
        : total > lote && <p className="fim">❦ fim da lista ❦</p>)}

      <div className="acoes">
        <button className="cta" onClick={() => startTransition(() => router.refresh())} disabled={atualizando}>
          {atualizando ? "Atualizando…" : "Atualizar lista"}
        </button>
        <button className="cta ghost" onClick={() => baixarCsv(rows)} disabled={!rows.length}>Baixar planilha (CSV)</button>
        <form action={sair}><button className="sair">Sair</button></form>
      </div>
      <img className="lis-corner br" src="/lirios-rosa.webp" alt="" aria-hidden />
    </main>
  );
}

