import { getStateRootByRPC } from '@/actions/rpc'
import { hostNetwork, HyperliquidProofRPC, wagmiConfig } from '@/config/wagmi'
import type { Claim, SigningMessage, VerificationResult } from '@/lib/types'
import { FLEXOR_ADDRESS, verifyFinalProof } from "@/lib/utils"
import { hashPersonalMessage } from '@ethereumjs/util'
import { getTransaction, readContract } from '@wagmi/core'
import abi from "public/Flexor.json"
import { createPublicClient, fromHex, http, toHex } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'

export const PROOF_CHUNK_NUMBER = 1;
export const CHUNK_SIZE = 16000;
export const LAST_PART_SIZE = 224;

// Find chain config by chainId from wagmiConfig.chains
export function getChainById(chainId: number) {
  return wagmiConfig.chains.find((chain) => chain.id === chainId)
}

export async function getLastBlockByChainId(chainId: number) {
    const chain = getChainById(chainId)
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`)

  // Create client dynamically for this chain using its first RPC url
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]), // or chain.rpcUrls.public.http[0]
  })

  // Fetch block
  const block = await client.getBlock()

  return block
}

export async function getTransactionReceiptWrapper(tx: `0x${string}`) {
    const chain = getChainById(hostNetwork.id)
  if (!chain) throw new Error(`Unsupported chainId ${hostNetwork.id}`)

  // Create client dynamically for this chain using its first RPC url
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]), // or chain.rpcUrls.public.http[0]
  })
  
  return waitForTransactionReceipt(client, {hash: tx})
}

async function getBlockByChainId(chainId: number, blockNumber: bigint ) {
  const chain = getChainById(chainId)
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`)

  // Create client dynamically for this chain using its first RPC url
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]), // or chain.rpcUrls.public.http[0]
  })

  // Fetch block
  const block = await client.getBlock({ blockNumber })

  return block
}

// async function getStateRootByChainId(chainId: number, blockNumber: bigint ) {
//   const chain = getChainById(chainId)
//   if (!chain) throw new Error(`Unsupported chainId ${chainId}`)

//   // Create client dynamically for this chain using its first RPC url
//   const client = createPublicClient({
//     chain,
//     transport: http(chain.rpcUrls.default.http[1], {timeout: 60_000}), // or chain.rpcUrls.public.http[0]
//   })

//   // Fetch block
//   const result = await client.getProof({ address: "0x0000000000000000000000000000000000000000", storageKeys: [], blockNumber: blockNumber })
//   return keccak256(result.accountProof[0]!)
// }


export async function readClaim(claimId: string): Promise<Claim> {
    const x = await readContract(wagmiConfig, {
        chainId: hostNetwork.id,
        abi,
        address: FLEXOR_ADDRESS,
        functionName: 'getClaim',
        args: [claimId],
    })
    console.log(x)
    return x as Claim
}

export async function fullVerifyProof(claimId: string, txHash: string): Promise<VerificationResult> {
    const claim = await readClaim(claimId)
    console.log(claim)
    const trx = await getTransaction(wagmiConfig, {hash: txHash as `0x${string}`, chainId: hostNetwork.id})
    const proofPart = trx.input.substring(522, 32448 + 522)
    const totalProof: `0x${string}` = `0x${proofPart}`
    console.log(totalProof)
    const proof = fromHex(totalProof, 'bytes')
    const publicInputs = Array.from(fromHex(claim.publicInputs, 'bytes'), (byte) => "0x" + byte.toString(16).padStart(2, '0')) 
    console.log(claim.full_message)
    const fullMessage = JSON.parse(claim.full_message) as SigningMessage
    console.log('Contract result:', fullMessage)
    console.log(claim)
    let name_check = false
    let verification_check = false
    let stateRoot_check = false
    let address_check = false
    let balance_target_check = false
    let message_hash_check = false
    
    // verify hl_name
    if ("flexor_name" in fullMessage)
        name_check = fullMessage.flexor_name!.endsWith(".hl") && (claim.flexor_hl === fullMessage.flexor_name)
    else
        name_check = claim.flexor_hl === ""
    // verify address
    if ("flexor_address" in fullMessage)
        address_check = claim.flexor_address.toLowerCase() === fullMessage.flexor_address!.toLowerCase()
    else
        address_check = claim.flexor_address === "0x0000000000000000000000000000000000000000"
    // verify stateRoot
    stateRoot_check = false

    let statusMessage = ""
    try {
        if (claim.chainId === 999n) {
            const stateRoot = await getStateRootByRPC(HyperliquidProofRPC, claim.blockNumber)
            stateRoot_check = stateRoot === claim.publicInputs.substring(0, 66)
            console.log(stateRoot)
            console.log(claim.publicInputs.substring(0, 66))
        } else {
            const block = await getBlockByChainId(+claim.chainId.toString(), claim.blockNumber)
            console.log(block.stateRoot)
            console.log(claim.publicInputs.substring(0, 66))
            stateRoot_check = block.stateRoot === claim.publicInputs.substring(0, 66)
        }
    } catch (err) {
        statusMessage += (err instanceof Error ? err.message : String(err)) + ' - '
    }

    // balance target
    const balance_target_length = +BigInt(publicInputs[96]!).toString()
    const balance_target = BigInt("0x" + claim.publicInputs.substring(2 + 32*4, 2 + 32 * 4 + balance_target_length * 2))
    balance_target_check = Math.floor(parseFloat(fullMessage.balance_target) * 1e18).toString() === balance_target.toString()

    // message hash
    const msgBuf = Buffer.from(claim.full_message)
    const hashed_message = hashPersonalMessage(msgBuf)
    message_hash_check = toHex(hashed_message) === "0x" + claim.publicInputs.substring(2 + 32*2, 2 + 32*4)

    // verify proof
    verification_check = await verifyFinalProof(proof, publicInputs)

    console.log("name_check ", name_check)
    console.log("address_check ", address_check)
    console.log("stateRoot_check ", stateRoot_check)
    console.log("verification_check ", verification_check)
    console.log("balance_target_check", balance_target_check)
    console.log("message_hash_check", message_hash_check)

    if (!name_check)
        statusMessage += "name check faild - "
    if (!address_check)
        statusMessage += "address check faild - "
    if (!stateRoot_check)
        statusMessage += "state root check faild - "
    if (!verification_check)
        statusMessage += "proof verification faild - "
    if (!balance_target_check)
        statusMessage += "balance target check faild - "
    if (!message_hash_check)
        statusMessage += "message check faild - "

    let status: 'verified' | 'rejected' | 'warning' = 'rejected'
    if (name_check && verification_check && address_check && balance_target_check && message_hash_check) {
        if (stateRoot_check) {
            status = 'verified'
            statusMessage = 'Proof is verified'
        }
        else if (claim.chainId === 999n) {
            statusMessage = 'Hyperliquid RPCs are broken to verify state root! Specific error:' + statusMessage
            status = 'warning'
        }
    }
    return {status, statusMessage}
}