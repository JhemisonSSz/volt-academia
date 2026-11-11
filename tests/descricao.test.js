// Testes dos textos das telas (descricao.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { nomeDoPagador } from "../public/js/descricao.js";

test("nomeDoPagador: aluno existente, ou 'Aluno removido' se ele foi excluído", () => {
  const estado = { alunos: [{ id: "ana", nome: "Ana" }] };
  assert.equal(nomeDoPagador(estado, { alunoId: "ana" }), "Ana");
  assert.equal(nomeDoPagador(estado, { alunoId: "sumiu", nomeAluno: "Carla" }), "Aluno removido");
});
