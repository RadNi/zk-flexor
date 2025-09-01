"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function callProver(endpoint: string, body: any) {
  const PROVER_SERVER = process.env.PROVER_SERVER!;
  console.log("posting: ", `${PROVER_SERVER}${endpoint}`)
  const res = await fetch(`${PROVER_SERVER}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  /* eslint-disable @typescript-eslint/no-unsafe-return */
  return res.json();
}
