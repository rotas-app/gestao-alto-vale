import fs from "node:fs";
import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "gestao-alto-vale-rules-test",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, "usuarios", "admin-1"), {
        uid: "admin-1",
        email: "admin@alto-vale.test",
        nome: "Admin",
        cargo: "admin",
        status: "ativo",
      }),
      setDoc(doc(db, "usuarios", "gestor-1"), {
        uid: "gestor-1",
        email: "gestor@alto-vale.test",
        nome: "Gestor",
        cargo: "gestor",
        status: "ativo",
        baseId: "blumenau",
      }),
      setDoc(doc(db, "convites", "token-seguro"), {
        token: "token-seguro",
        email: "novo@alto-vale.test",
        nome: "Novo Gestor",
        cargo: "gestor",
        status: "pendente",
        baseId: "blumenau",
      }),
      setDoc(doc(db, "motoristas", "motorista-blumenau"), {
        nomeCompleto: "Motorista Blumenau",
        baseId: "blumenau",
        ativo: true,
      }),
      setDoc(doc(db, "motoristas", "motorista-outra-base"), {
        nomeCompleto: "Motorista Outra Base",
        baseId: "outra-base",
        ativo: true,
      }),
    ]);
  });
});

after(async () => {
  await testEnv.cleanup();
});

test("convites nao podem ser listados publicamente", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(getDocs(collection(db, "convites")));
  await assertSucceeds(getDoc(doc(db, "convites", "token-seguro")));
});

test("usuario comum nao pode criar perfil administrador", async () => {
  const db = testEnv
    .authenticatedContext("invasor", { email: "invasor@teste.com" })
    .firestore();

  await assertFails(
    setDoc(doc(db, "usuarios", "invasor"), {
      uid: "invasor",
      email: "invasor@teste.com",
      nome: "Invasor",
      cargo: "admin",
      status: "ativo",
    })
  );
});

test("convite valido permite criar somente perfil gestor vinculado", async () => {
  const db = testEnv
    .authenticatedContext("novo-gestor", {
      email: "novo@alto-vale.test",
    })
    .firestore();

  await assertSucceeds(
    setDoc(doc(db, "usuarios", "novo-gestor"), {
      uid: "novo-gestor",
      email: "novo@alto-vale.test",
      nome: "Novo Gestor",
      cargo: "gestor",
      status: "ativo",
      baseId: "blumenau",
      conviteToken: "token-seguro",
    })
  );
});

test("gestor acessa somente documentos da propria base", async () => {
  const db = testEnv
    .authenticatedContext("gestor-1", {
      email: "gestor@alto-vale.test",
    })
    .firestore();

  await assertSucceeds(
    getDocs(
      query(
        collection(db, "motoristas"),
        where("baseId", "==", "blumenau")
      )
    )
  );
  await assertFails(getDoc(doc(db, "motoristas", "motorista-outra-base")));
});

test("gestor atualiza metricas agregadas somente na propria base", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "metricas", "metrica-blumenau"), {
      motoristaId: "motorista-blumenau",
      motoristaNome: "Motorista Blumenau",
      baseId: "blumenau",
      idRota: "393102382",
      qtdPacotesTotal: 0,
      qtdPacotesNaoEntregues: 0,
      ds: 0,
    });
  });

  const db = testEnv
    .authenticatedContext("gestor-1", {
      email: "gestor@alto-vale.test",
    })
    .firestore();

  await assertSucceeds(
    setDoc(
      doc(db, "metricas", "metrica-blumenau"),
      {
        qtdPacotesTotal: 22,
        qtdPacotesEntregues: 20,
        qtdPacotesPendentes: 2,
        qtdPacotesNaoEntregues: 0,
        origemSincronizacao: "mercado_livre_extensao",
      },
      { merge: true }
    )
  );

  await assertFails(
    setDoc(
      doc(db, "metricas", "metrica-blumenau"),
      { baseId: "outra-base" },
      { merge: true }
    )
  );
});

test("somente admin pode listar usuarios", async () => {
  const gestorDb = testEnv
    .authenticatedContext("gestor-1", {
      email: "gestor@alto-vale.test",
    })
    .firestore();
  const adminDb = testEnv
    .authenticatedContext("admin-1", {
      email: "admin@alto-vale.test",
    })
    .firestore();

  await assertFails(getDocs(collection(gestorDb, "usuarios")));
  await assertSucceeds(getDocs(collection(adminDb, "usuarios")));
  assert.ok(true);
});
