// Um import sobrepõe-se aos dados que já lá estão. Estes testes garantem que
// só passa o que é mesmo um backup desta app.
import { describe, it, expect } from "vitest";
import { validarBackup, VERSAO_BACKUP } from "@/lib/backup";

const valido = {
  versao: VERSAO_BACKUP,
  app: "My Daily Compass",
  exportadoEm: "2026-09-09T10:00:00.000Z",
  chaves: { "garcia:tarefas": [], "garcia:config": { nome: "Ana" } },
};

describe("validarBackup", () => {
  it("aceita um backup bem formado", () => {
    const b = validarBackup(valido);
    expect(Object.keys(b.chaves)).toHaveLength(2);
    expect(b.versao).toBe(VERSAO_BACKUP);
  });

  it("recusa o que não é objecto", () => {
    for (const lixo of [null, undefined, 42, "texto", [1, 2]]) {
      expect(() => validarBackup(lixo)).toThrow();
    }
  });

  it("recusa um ficheiro sem versão", () => {
    const { versao: _, ...semVersao } = valido;
    expect(() => validarBackup(semVersao)).toThrow(/vers/i);
  });

  it("recusa um backup de uma versão futura da app", () => {
    expect(() => validarBackup({ ...valido, versao: VERSAO_BACKUP + 1 })).toThrow(/Actualiza a app/);
  });

  it("recusa um backup vazio", () => {
    expect(() => validarBackup({ ...valido, chaves: {} })).toThrow(/vazio/i);
  });

  it("recusa JSON de outra aplicação qualquer", () => {
    expect(() => validarBackup({ versao: 1, chaves: { outraCoisa: 1 } })).toThrow(/nenhuma chave desta app/);
  });

  it("tolera a falta de campos acessórios", () => {
    const b = validarBackup({ versao: 1, chaves: { "garcia:tarefas": [] } });
    expect(b.app).toBeTruthy();
    expect(b.exportadoEm).toBe("");
  });
});
