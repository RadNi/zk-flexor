import { Barretenberg, RawBuffer, UltraHonkBackend, type ProofData } from "@aztec/bb.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import mptBodyCircuit from "@/target/inner_mpt_body.json";
import mptBodyInitialCircuit from "@/target/initial_mpt_body.json";
import balanceCheckCircuit from "@/target/leaf_check.json";
import { Noir, type CompiledCircuit, type InputMap } from "@noir-lang/noir_js";
import { callProver } from "@/actions/prover";


// export const FLEXOR_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
// export const FLEXOR_ADDRESS = "0x789f7b39e6C356044E617724be3bbb441b4E4438"
// export const FLEXOR_ADDRESS = "0x8464135c8F25Da09e49BC8782676a84730C318bC"
export const FLEXOR_ADDRESS = "0xCAFD9654a73bfD85eB4a5270565744D08075dE74"

const mptBodyInitialBackend = new UltraHonkBackend(mptBodyInitialCircuit.bytecode, { threads: 5 }, { recursive: true });
const mptBodyBackend = new UltraHonkBackend(mptBodyCircuit.bytecode, { threads: 5 }, { recursive: true });

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

export async function verifyInitialProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) {
    return await mptBodyInitialBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
}

export async function verifyIntermediaryProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]) {
  return mptBodyBackend.verifyProof({ proof: proof, publicInputs: publicInputs });
}

export interface IProver {
  generateInitialProof(inputs: InputMap): Promise<ProofData>;
  generateIntermediaryProof(inputs: InputMap): Promise<ProofData>;
  generateFinalProof(inputs: InputMap): Promise<ProofData>;
  verifyFinalProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]): Promise<boolean>;
}

// ===== Client-side Prover =====
export class ClientProver implements IProver {


  private mptBodyInitialCircuitNoir = new Noir(mptBodyInitialCircuit as CompiledCircuit);
  private mptBodyCircuitNoir = new Noir(mptBodyCircuit as CompiledCircuit);
  private mptBodyInitialBackend = new UltraHonkBackend(mptBodyInitialCircuit.bytecode, { threads: 5 }, { recursive: true });
  private mptBodyBackend = new UltraHonkBackend(mptBodyCircuit.bytecode, { threads: 5 }, { recursive: true });
  private balanceCheckNoir = new Noir(balanceCheckCircuit as CompiledCircuit);
  private balanceCheckBackend = new UltraHonkBackend(balanceCheckCircuit.bytecode, { threads: 5 }, { recursive: true });

  async getVerificationKeys() {
    const mptBodyInitialCircuitVerificationKey = await this.mptBodyInitialBackend.getVerificationKey();
    const mptBodyCircuitVerificationKey = await this.mptBodyBackend.getVerificationKey();
    const finalVerificationKey = await this.mptBodyBackend.getVerificationKey();

    const barretenbergAPI = await Barretenberg.new({ threads: 5 });
    const bodyInitialVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyInitialCircuitVerificationKey))).map(f => f.toString());
    const bodyVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(mptBodyCircuitVerificationKey))).map(f => f.toString());
    const finalVkAsFields = (await barretenbergAPI.acirVkAsFieldsUltraHonk(new RawBuffer(finalVerificationKey))).map(f => f.toString());

    return { bodyInitialVkAsFields, bodyVkAsFields, finalVkAsFields };
  }


  async generateInitialProof(inputs: InputMap): Promise<ProofData> {
    const witness = await this.mptBodyInitialCircuitNoir.execute(inputs);
    return await this.mptBodyInitialBackend.generateProof(witness.witness);
  }

  async generateIntermediaryProof(inputs: InputMap): Promise<ProofData> {
    const { witness } = await this.mptBodyCircuitNoir.execute(inputs);
    return await this.mptBodyBackend.generateProof(witness);
  }

  async generateFinalProof(inputs: InputMap): Promise<ProofData> {
    const { witness } = await this.balanceCheckNoir.execute(inputs);
    return await this.balanceCheckBackend.generateProof(witness, { keccakZK: true });
  }

  async verifyFinalProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]): Promise<boolean> {
    return this.balanceCheckBackend.verifyProof({ proof, publicInputs }, { keccakZK: true });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function encodeProofOutput(proof: any): ProofData {
  return {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    proof: new Uint8Array(proof.proof),
    publicInputs: proof.publicInputs,
  };
}

// ===== Server-side Prover =====
export class ServerProver implements IProver {
  async generateInitialProof(inputs: InputMap): Promise<ProofData> {
    const res = await callProver("/generate-initial-proof", { inputs });
    return encodeProofOutput(res.proof);
  }

  async generateIntermediaryProof(inputs: InputMap): Promise<ProofData> {
    const res = await callProver("/generate-intermediary-proof", { inputs });
    return encodeProofOutput(res.proof);
  }

  async generateFinalProof(inputs: InputMap): Promise<ProofData> {
    const res = await callProver("/generate-final-proof", { inputs });
    return encodeProofOutput(res.proof);
  }

  async verifyFinalProof(proof: Uint8Array<ArrayBufferLike>, publicInputs: string[]): Promise<boolean> {
    return (await callProver("/verify", { proof: Array.from(proof), publicInputs })).success as boolean;
  }
}
