import { Barretenberg, RawBuffer, UltraHonkBackend } from "@aztec/bb.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import mptBodyCircuit from "@/target/inner_mpt_body.json";
import mptBodyInitialCircuit from "@/target/initial_mpt_body.json";
import balanceCheckCircuit from "@/target/leaf_check.json";
import { Noir, type CompiledCircuit, type InputMap } from "@noir-lang/noir_js";

// export const FLEXOR_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
// export const FLEXOR_ADDRESS = "0x789f7b39e6C356044E617724be3bbb441b4E4438"
// export const FLEXOR_ADDRESS = "0x8464135c8F25Da09e49BC8782676a84730C318bC"
export const FLEXOR_ADDRESS = "0xCAFD9654a73bfD85eB4a5270565744D08075dE74"


const mptBodyInitialCircuitNoir = new Noir(mptBodyInitialCircuit as CompiledCircuit);
const mptBodyCircuitNoir = new Noir(mptBodyCircuit as CompiledCircuit);
const mptBodyInitialBackend = new UltraHonkBackend(mptBodyInitialCircuit.bytecode, { threads: 5 }, { recursive: true });
const mptBodyBackend = new UltraHonkBackend(mptBodyCircuit.bytecode, { threads: 5 }, { recursive: true });
const balanceCheckNoir = new Noir(balanceCheckCircuit as CompiledCircuit);
const balanceCheckBackend = new UltraHonkBackend(balanceCheckCircuit.bytecode, { threads: 5 }, { recursive: true });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getVerificationKeys() {
    const mptBodyInitialCircuitVerificationKey = await mptBodyInitialBackend.getVerificationKey();

    const mptBodyCircuitVerificationKey = await mptBodyBackend.getVerificationKey();

    const finalVerificationKey = await mptBodyBackend.getVerificationKey();
    const barretenbergAPI = await Barretenberg.new({ threads: 5 });
    const bodyInitialVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyInitialCircuitVerificationKey))).map(field => field.toString());
    const bodyVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyCircuitVerificationKey))).map(field => field.toString());
    const finalVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(finalVerificationKey))).map(field => field.toString());
    return {
      bodyInitialVkAsFields,
      bodyVkAsFields,
      finalVkAsFields
    }
}

export async function generateInitialProof(inputs: InputMap) {
    const initial_witness = await mptBodyInitialCircuitNoir.execute(inputs)
    return await mptBodyInitialBackend.generateProof(initial_witness.witness);
}

export async function verifyInitialProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) {
    return await mptBodyInitialBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
}

export async function generateIntermediaryProof(inputs: InputMap) {
  
  const { witness } = await mptBodyCircuitNoir.execute(inputs)
  return mptBodyBackend.generateProof(witness);
}

export async function verifyIntermediaryProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) {
  return mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
}

export async function generateFinalProof(inputs: InputMap) {
  
    const { witness } = await balanceCheckNoir.execute(inputs)
    return balanceCheckBackend.generateProof(witness, {keccakZK: true});
}

export async function verifyFinalProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) {
    return balanceCheckBackend.verifyProof({ proof: proof, publicInputs: publicInputs }, {keccakZK: true});
}