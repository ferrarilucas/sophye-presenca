import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "lista_auth";

// o cookie guarda um hash da senha (nunca a senha); trocar LISTA_SENHA desloga todo mundo
export function token(senha: string) {
  return createHash("sha256").update(`sophye-xv:${senha}`).digest("hex");
}

export function senhaConfigurada() {
  return !!process.env.LISTA_SENHA;
}

function igual(a: string, b: string) {
  const x = Buffer.from(token(a)), y = Buffer.from(token(b));
  return timingSafeEqual(x, y);
}

export function senhaCorreta(tentativa: string) {
  const senha = process.env.LISTA_SENHA;
  return !!senha && igual(tentativa, senha);
}

export async function autenticado() {
  const senha = process.env.LISTA_SENHA;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!senha || !v) return false;
  const a = Buffer.from(v), b = Buffer.from(token(senha));
  return a.length === b.length && timingSafeEqual(a, b);
}
