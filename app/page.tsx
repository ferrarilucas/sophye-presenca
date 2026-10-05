import { autenticado, senhaConfigurada } from "@/lib/auth";
import { getRsvps, type Rsvp } from "@/lib/data";
import Login from "@/components/Login";
import Lista from "@/components/Lista";
import { Ornament } from "@/components/Ornament";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!senhaConfigurada())
    return <Aviso titulo="Quase lá" texto="Defina a variável LISTA_SENHA para proteger a lista de convidados." />;
  if (!(await autenticado())) return <Login />;

  let rows: Rsvp[];
  try {
    rows = await getRsvps();
  } catch (e) {
    return <Aviso titulo="Ops" texto={`Não foi possível carregar a lista. ${(e as Error).message}`} />;
  }
  return <Lista rows={rows} />;
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="page center">
      <img className="mono" src="/monograma.png" alt="" />
      <h1 className="script gold-text">{titulo}</h1>
      <Ornament />
      <p className="note">{texto}</p>
    </main>
  );
}
