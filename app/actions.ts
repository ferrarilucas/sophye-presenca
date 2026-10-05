"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, senhaCorreta, token } from "@/lib/auth";

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  const senha = process.env.LISTA_SENHA;
  if (!senha) return "Senha não configurada (LISTA_SENHA).";
  if (!senhaCorreta(String(form.get("senha") ?? ""))) return "Senha incorreta 💔";
  (await cookies()).set(COOKIE, token(senha), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60,
  });
  redirect("/");
}

export async function sair() {
  (await cookies()).delete(COOKIE);
  redirect("/");
}
