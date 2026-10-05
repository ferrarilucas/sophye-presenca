"use client";
import { useActionState } from "react";
import { entrar } from "@/app/actions";
import { Ornament } from "./Ornament";

export default function Login() {
  const [err, action, pending] = useActionState(entrar, null);
  return (
    <main className="page center">
      <img className="lis-corner tl" src="/lirios-rosa.webp" alt="" aria-hidden />
      <img className="mono" src="/monograma.png" alt="Monograma SA" />
      <h1 className="script gold-text">Lista de Convidados</h1>
      <p className="xv">XV ANOS · SOPHYE</p>
      <Ornament />
      <form action={action} className="login">
        <label className="field"><span>Senha</span>
          <input name="senha" type="password" autoComplete="current-password" autoFocus required />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="cta" disabled={pending}>{pending ? "Entrando…" : "Ver lista"}</button>
      </form>
      <img className="lis-corner br" src="/lirios-rosa.webp" alt="" aria-hidden />
    </main>
  );
}
