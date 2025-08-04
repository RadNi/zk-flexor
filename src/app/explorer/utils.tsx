import { hostNetwork, wagmiConfig } from '@/config/wagmi'
import { FLEXOR_ADDRESS, verifyFinalProof } from "@/lib/utils"
import { hashPersonalMessage } from '@ethereumjs/util'
import { readContract } from '@wagmi/core'
import abi from "public/Flexor.json"
import { createPublicClient, fromHex, http, toHex } from 'viem'

type VerificationResult = { 
    status: 'verified' | 'rejected' | 'warning'; 
    statusMessage: string
}

type Claim = {
    proof: `0x${string}`, 
    publicInputs: `0x${string}`, 
    full_message: string, 
    flexor_hl: string, 
    flexor_address: `0x${string}`, 
    chainId: bigint, 
    blockNumber: bigint
}

// Find chain config by chainId from wagmiConfig.chains
export function getChainById(chainId: number) {
  return wagmiConfig.chains.find((chain) => chain.id === chainId)
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


export async function readClaim(claimId: string): Promise<Claim> {
    return await readContract(wagmiConfig, {
        chainId: hostNetwork.id,
        abi,
        address: FLEXOR_ADDRESS,
        functionName: 'getClaim',
        args: [claimId],
    }) as Claim
}

export async function fullVerifyProof(claimId: string): Promise<VerificationResult> {
    const claim = await readClaim(claimId)
    const proof = fromHex(claim.proof, 'bytes')
    const publicInputs = Array.from(fromHex(claim.publicInputs, 'bytes'), (byte) => "0x" + byte.toString(16).padStart(2, '0')) 
    const fullMessage = JSON.parse(claim.full_message)
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
        name_check = fullMessage.flexor_name.endsWith(".hl") && (claim.flexor_hl === fullMessage.flexor_name)
    else
        name_check = claim.flexor_hl === ""
    // verify address
    if ("flexor_address" in fullMessage)
        address_check = claim.flexor_address.toLowerCase() === fullMessage.flexor_address.toLowerCase()
    else
        address_check = claim.flexor_address === "0x0000000000000000000000000000000000000000"
    // verify stateRoot
    stateRoot_check = false

    let statusMessage = ""
    try {
        let block = await getBlockByChainId(+claim.chainId.toString(), claim.blockNumber)
        console.log(block.stateRoot)
        console.log(claim.publicInputs.substring(0, 66))
        stateRoot_check = block.stateRoot === claim.publicInputs.substring(0, 66)
    } catch (err) {
        statusMessage += (err + " - ")
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
            statusMessage = 'Hyperliquid RPCs are broken to verify state root!'
            status = 'warning'
        }
    }
    return {status, statusMessage}
}