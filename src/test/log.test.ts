// Regressão: o antigo `enforceLogLimits` era chamado na gravação e apagava do
// Supabase os registos com mais de 7 dias, ou acima de 7 por negócio. Estes
// testes garantem que o histórico deixou de ser truncado.
import { describe, it, expect } from "vitest";
import { logOrdenado, LOG_VISIVEL_INICIAL, type LogEntry } from "@/lib/garcia";

const entrada = (id: string, diasAtras: number): LogEntry => {
  const d = new Date(Date.now() - diasAtras * 86400000).toISOString();
  return { id, tipo: "venda", negocio: "n1", descricao: id, valor: 100, custo: 50,
    lucroVenda: 50, cliente: "", qty: 1, data: d.split("T")[0], registadoEm: d };
};

describe("registo de transações", () => {
  it("não apaga nada, por muitas entradas ou antigas que sejam", () => {
    const log = Array.from({ length: 40 }, (_, i) => entrada(`e${i}`, i * 3)); // até 117 dias
    const r = logOrdenado(log);
    expect(r).toHaveLength(40);
    expect(new Set(r.map(e => e.id)).size).toBe(40);
  });

  it("ordena do mais recente para o mais antigo", () => {
    const r = logOrdenado([entrada("velha", 30), entrada("nova", 0), entrada("media", 10)]);
    expect(r.map(e => e.id)).toEqual(["nova", "media", "velha"]);
  });

  it("não muta o array original", () => {
    const orig = [entrada("a", 5), entrada("b", 1)];
    logOrdenado(orig);
    expect(orig.map(e => e.id)).toEqual(["a", "b"]);
  });

  it("só a apresentação limita — o resto continua acessível", () => {
    const log = Array.from({ length: 25 }, (_, i) => entrada(`e${i}`, i));
    const todas = logOrdenado(log);
    expect(todas.slice(0, LOG_VISIVEL_INICIAL)).toHaveLength(10);
    expect(todas).toHaveLength(25);
  });
});
