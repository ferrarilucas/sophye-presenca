"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Rsvp } from "@/lib/data";
import { sair } from "@/app/actions";
import { Ornament } from "./Ornament";

type Aba = "sim" | "nao";
type Modo = "grupos" | "az";
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

  const sim = useMemo(() => rows.filter((r) => r.vai), [rows]);
  const nao = useMemo(() => rows.filter((r) => !r.vai), [rows]);
  const respostas = useMemo(() => new Set(rows.map((r) => r.grupo)).size, [rows]);
  const recados = useMemo(() => rows.filter((r) => r.mensagem).length, [rows]);

  const atual = aba === "sim" ? sim : nao;
  const q = norm(busca.trim());
  const filtradas = q ? atual.filter((r) => norm(r.nome).includes(q) || norm(r.mensagem ?? "").includes(q)) : atual;
  const grupos = useMemo(() => {
    if (!q) return agrupar(filtradas);
    // na busca, mostra o grupo inteiro de quem bateu
    const ids = new Set(filtradas.map((r) => r.grupo));
    return agrupar(atual.filter((r) => ids.has(r.grupo)));
  }, [filtradas, atual, q]);
  const az = useMemo(() => [...filtradas].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [filtradas]);

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

      {filtradas.length === 0 ? (
        <p className="vazio">{q ? "Ninguém encontrado com esse nome." : aba === "sim" ? "Ainda sem confirmações. Logo, logo chegam 💗" : "Ninguém recusou até agora 🥰"}</p>
      ) : modo === "grupos" ? (
        <ul className="grupos" key={aba + modo}>
          {grupos.map((g, i) => (
            <li key={g.id} className={`card ${aba}`} style={{ animationDelay: `${Math.min(i, 12) * 0.05}s` }}>
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
          {az.map((p) => (
            <li key={p.id}>
              <span>{p.nome}</span>
              {!p.titular && <small>acompanhante</small>}
            </li>
          ))}
        </ol>
      )}

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
