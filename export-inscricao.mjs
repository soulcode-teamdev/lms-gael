import { readFileSync, writeFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// carrega .env.local
const env = {};
for (const line of readFileSync(new URL("./.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const pick = (d, keys) => {
  for (const k of Object.keys(d)) {
    if (keys.includes(k.toLowerCase())) return d[k];
  }
  return "";
};
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const snap = await getDocs(collection(db, "inscricaoGael"));
console.log("Documentos encontrados:", snap.size);

const rows = [["nome", "email", "telefone"]];
snap.forEach((doc) => {
  const d = doc.data();
  rows.push([
    pick(d, ["nome", "name", "nomecompleto", "fullname"]),
    pick(d, ["email", "e-mail"]),
    pick(d, ["telefone", "phonenumber", "whatsapp", "celular", "phone", "tel"]),
  ]);
});

const csv = "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
const out = new URL("./inscricaoGael.csv", import.meta.url);
writeFileSync(out, csv);
console.log("CSV salvo em inscricaoGael.csv");
// amostra pra conferir campos
if (snap.size) console.log("Chaves do 1o doc:", Object.keys(snap.docs[0].data()));
process.exit(0);
