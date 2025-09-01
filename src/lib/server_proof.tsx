// zkApi.ts

// async function post<T>(endpoint: string, body: any): Promise<T> {
//     console.log("sending: ", body)
//   const res = await fetch(`${PROVER_SERVER}${endpoint}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });

//   if (!res.ok) {
//     const errText = await res.text();
//     throw new Error(`API error ${res.status}: ${errText}`);
//   }

//   return res.json();
// }

// function encodeProofOutput(proof: any) {
//     console.log("in encoding: ", proof)
//     return {
//         proof: new Uint8Array(proof.proof),
//         publicInputs: proof.publicInputs
//     }
// }

// export async function serverGenerateInitialProof(inputs: any) {
//     console.log("sending1: ", inputs.new_root)
//   return post<{ proof: any }>("/generate-initial-proof", { inputs }).then(x => encodeProofOutput(x.proof));
// }

// export async function serverGenerateIntermediaryProof(inputs: any) {
//   return post<{ proof: any }>("/generate-intermediary-proof", { inputs }).then(x => encodeProofOutput(x.proof));
// }

// export async function serverGenerateFinalProof(inputs: any) {
//   return post<{ proof: any }>("/generate-final-proof", { inputs }).then(x => encodeProofOutput(x.proof));
// }

// export function serverVerifyFinalProof(proof: any, publicInputs: any) {
//   return post<{ success: boolean }>("/verify", { proof: Array.from(proof), publicInputs });
// }
