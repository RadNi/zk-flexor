import { deflattenFields, type ProofData } from "@aztec/bb.js";
import { type InputMap } from '@noir-lang/noir_js';
import { keccak256 } from "ethers";
import { innner_layer_vk, final_vk } from "@/target/verification_keys";
import { calculateSigRecovery, ecrecover, fromRPCSig, hashPersonalMessage, pubToAddress, type PrefixedHexString } from "@ethereumjs/util";
import { getNodesFromProof, type MPTProof, type Node } from "mpt-noirjs"
import { getProof, getAccount, signMessage } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi';
import { toBytes } from 'viem';
import { generateFinalProof, generateInitialProof, generateIntermediaryProof, verifyFinalProof } from './utils';
import { createPublicClient, http } from 'viem'
import type { ProofRequest, SigningMessage, SubmitionInputs } from "./types";
import { bigintToUint8Array, getInitialPlaceHolderInput, getInitialPublicInputs, hexStringToStringUint8Array, uint8ArrayToStringArray } from "./proof_helpers";

export async function getCurrentBlockNumber(chainId: number): Promise<bigint> {
  const chain = wagmiConfig.chains.find((c) => c.id === chainId)
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`)

  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  })

  return await client.getBlockNumber()
}
let increment = 0
// let account: Account
// let trie_key: number[]
let mpt_proof: MPTProof
const nodes_initial: Node[] = []
const nodes_inner: Node[] = []
let root: number[]
let new_roots: number[][]
let hashed_message : string[]
let pub_key_x: string[]
let pub_key_y: string[]
let signature : string[]

function get_final_vkey_hash() {
  const bytesArrays = final_vk.map(h => toBytes(h))
  let final_key: Uint8Array[] = []
  bytesArrays.forEach(e => final_key = final_key.concat(e));
  // const final_key = Uint8Array.from(final_vk.map(h => parseInt(h.substring(2), 16)))
  console.log(final_key)
  console.log(keccak256(Uint8Array.from(final_key)))
  return keccak256(Uint8Array.from(final_key))
}

function get_signing_message(
  request: ProofRequest
): string {
  const msg: SigningMessage = {
    message: "ZK Flexor native token proof",
    balance_target: request.balance.toString(),
    version_hash: get_final_vkey_hash(),
  }

  if (request.name) msg.flexor_name = request.name
  if (request.address) msg.flexor_address = request.address
  if (request.message) msg.custom_message = request.message

  return JSON.stringify(msg, null, 2)
}

async function sign_message(
  from: `0x${string}`, 
  request: ProofRequest
) {
  if (window.ethereum) {
    const msg = get_signing_message(request)
    console.log("msg before signing")
    console.log(msg)
    const signature_: PrefixedHexString = await signMessage(wagmiConfig, {
      account: from,
      message: msg
    })
    // await window.ethereum!.request({
    //     method: "personal_sign",
    //     params: [msg, from],
    // }) as PrefixedHexString
    const msgBuf = Buffer.from(msg)
    const {r, s, v} = fromRPCSig(signature_)
    const hashed_message_ = hashPersonalMessage(msgBuf)

    const pk = ecrecover(hashed_message_, calculateSigRecovery(v), r, s, 1n)
    console.log("Adreeesss")
    console.log(pubToAddress(pk))
    console.log("Public key")
    console.log(pk)

    pub_key_x = []
    pk.slice(0, 32).forEach(x => {
        pub_key_x.push("" + x)
    });
    pub_key_y= []
    pk.slice(32).forEach(y => {
        pub_key_y.push("" + y)
    });

    signature = hexStringToStringUint8Array(signature_.substring(2, 130))
    hashed_message = uint8ArrayToStringArray(hashed_message_)

    console.log("public key x coordinate 📊: ", pub_key_x);
    console.log("public key y coordinate 📊: ", pub_key_y);
    console.log("hashed_message: ", hashed_message)
    console.log("signature: ", signature)
    }
}



async function generate_proof_inner(show: (arg0: string, arg1?: number)=>void, request: ProofRequest): Promise<ProofData> {
    const {balance_target: prepared_balance_target, balance_target_length} = getBalanceTargetMain(request.balance)
    // show("Generating circuits verification keys... ⏳");
    let recursiveProof;
    let input;

    increment = 100 / (1 + nodes_inner.length + 1 + 2)
    // initial layer
    const initial_nodes_length = nodes_initial.length
    let new_index = 0
    nodes_initial.map(e => new_index += e.prefix_addition)
    input = {
      nodes: nodes_initial,
      node_length: initial_nodes_length,
      trie_key_new_index: new_index,
      root: root,
      trie_key: mpt_proof.trie_account.trie_key,
      new_root: new_roots[initial_nodes_length - 1],
      public_inputs: getInitialPublicInputs(mpt_proof.trie_account.trie_key, root!),
      placeholder: getInitialPlaceHolderInput()
    } as InputMap
    show("Generating initial proof witness... ⏳ ");
    console.log(input)
    show("Generating initial proof... ⏳ ");
    const initial_proof = await generateInitialProof(input)
    // show("Verifying initial proof... ⏳", increment);
    // const initial_verified = await verifyInitialProof(initial_proof.proof, initial_proof.publicInputs)
    // show("Initial proof verified: " + initial_verified, increment);
    recursiveProof = {proof: deflattenFields(initial_proof.proof), publicInputs: initial_proof.publicInputs}
    
    for (let i = 0; i < nodes_inner.length; i++) {
        console.log(i + initial_nodes_length)
        console.log(new_roots[i + initial_nodes_length])
    }
    
    for (let i = 0; i < nodes_inner.length; i++) {
        new_index += nodes_inner[i]!.prefix_addition
        input = {
          nodes: [nodes_inner[i]],
          node_length: 1,
          trie_key_new_index: new_index,
          root: root,
          trie_key: mpt_proof.trie_account.trie_key,
          new_root: new_roots[i + initial_nodes_length],
          proof: recursiveProof.proof,
          public_inputs: recursiveProof.publicInputs,
          verification_key: innner_layer_vk,
          is_first_inner_layer: 0
        } as InputMap
        if (i == 0) {
          // second layer
          input.is_first_inner_layer = 1
          // show("Generating witness for recursive proof #" + (i+1) + " ...⏳ ");
          console.log(input)
          // const { witness } = await mptBodyCircuitNoir.execute(input)
          show("Generating recursive proof #" + (i+1) + " ...⏳ ", increment);
          const {proof, publicInputs} = await generateIntermediaryProof(input)
          // show("Verifying intermediary proof #" + (i+1) + " ...⏳ ", increment);
          // const verified = await verifyIntermediaryProof(proof, publicInputs)
          // show("Intermediary proof verified: " + verified, increment);
          recursiveProof = {proof: deflattenFields(proof), publicInputs}
        } else {
          // rest of the layers
          input.is_first_inner_layer = 0
          // show("Generating witness for recursive proof #" + (i+1) + " ...⏳ ");
          console.log(input)
          show("Generating intermediary proof #" + (i+1) + " ...⏳ ", increment);
          const {proof, publicInputs} = await generateIntermediaryProof(input)
          console.log(proof)
          console.log(publicInputs)
          // show("Verifying intermediary proof #" + (i+1) + " ...⏳ ", increment);
          // const verified = await verifyIntermediaryProof(proof, publicInputs)
          // show("Intermediary proof verified: " + verified, increment);
          recursiveProof = {proof: deflattenFields(proof), publicInputs}
        }
    }
    console.log(recursiveProof.proof)
    console.log(recursiveProof.publicInputs)



    const balanceCheckInput = {
        account: mpt_proof.trie_account.account,
        root: root,
        leaf_hash_: new_roots[new_roots.length - 1],
        
        balance_target: prepared_balance_target,
        balance_target_length,
        proof: recursiveProof.proof,
        trie_key_index: nodes_initial.length + nodes_inner.length,
        // verification_key: innner_layer_vk,
        hashed_message: hashed_message,
        // public_key: public_key,
        pub_key_x: pub_key_x,
        pub_key_y: pub_key_y,
        signature: signature,
        public_inputs: recursiveProof.publicInputs
    } as InputMap
    console.log(balanceCheckInput)
    // show("Generating witness for final proof ...⏳ ");
    show("Generating final proof ...⏳ ", increment);
    const finalProof = await generateFinalProof(balanceCheckInput)
    show("Final proof:")
    console.log(finalProof)

    // Verify recursive proof
    show("Verifying final proof... ⏳", increment);
    const verified = await verifyFinalProof(finalProof.proof, finalProof.publicInputs)
    show("Final proof verified: " + verified, increment);

    return finalProof
}


export function getBalanceTargetMain(balanceTarget: number) {
    const btb = BigInt(balanceTarget * 1e18)
    const balance_target = bigintToUint8Array(btb)
    const balance_target_length = balance_target.length
    while (balance_target.length != 32)
        balance_target.push(0)
    return {balance_target, balance_target_length}
}

async function initialize(
  show: (arg0: string, arg1?: number)=>void, 
  request: ProofRequest): Promise<bigint> {
    show("Reading data from RPC... ⏳");
    
    const address = getAccount(wagmiConfig).address!
    const blockNumber = await getCurrentBlockNumber(getAccount(wagmiConfig).chainId!)
    const output = await getProof(wagmiConfig, {
      address: address,
      blockNumber: blockNumber, 
      storageKeys: [],
    })
    await sign_message(address, request)

    console.log(output)
    mpt_proof = getNodesFromProof(output.accountProof, address)
      
    for (let index = 0; index < mpt_proof.nodes.length; index++) {
      const node = mpt_proof.nodes[index]!
      if (index < 3)
        nodes_initial.push(node)
      else
        nodes_inner.push(node)
    }

    root = mpt_proof.roots[0]!
    new_roots = mpt_proof.roots.slice(1)
    console.log(nodes_initial)
    console.log(nodes_inner)
    console.log(mpt_proof.trie_account.account)
    console.log(new_roots)
    console.log(root)
    console.log("blockNumber: ", blockNumber)
    return blockNumber
}

let currentProgress = 0

export async function generateProof (
  request: ProofRequest,
  updateProgress: (step: number, label: string) => void,
  setSubmitionInput: (arg: SubmitionInputs) => void
) {

  const tick = (label: string, increment = 0) => {
    currentProgress = Math.min(currentProgress + increment, 100)
    console.log(label)
    updateProgress(currentProgress, label)
  }


  console.log(request.balance)
  const blockNumber = await initialize(tick, request)
  console.log("generating proof")
  const {proof, publicInputs} = await generate_proof_inner(tick, request)
  // const proof = Uint8Array.from(Array(16224).fill([10]).flat())
  // const publicInputs = Array(97).fill([`0x${10}`]).flat()
  const submitionInput: SubmitionInputs = {
    proof: proof,
    publicInputs: Uint8Array.from(publicInputs.map(x => Number(x))),
    blockNumber: blockNumber,
    flexor_address: request.address,
    flexor_hl: request.name,
    chainId: getAccount(wagmiConfig).chainId!,
    full_message: get_signing_message(request),
    tip: (10n**17n)*3n,
    custom_message: request.message
  }
  // if (requestInputs.address)
  //   submitionInput.flexor_address = requestInputs.address
  // if (requestInputs.name)
  //   submitionInput.flexor_hl = requestInputs.name
  // if (requestInputs.message)
  //   submitionInput.custom_message = requestInputs.message


  // tick("Fake proof generation!", 100)
  console.log(submitionInput)
  setSubmitionInput(submitionInput)
}
