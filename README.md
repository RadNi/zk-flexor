# EVM Balance Prover

A zero-knowledge prover for verifying **ETH balances** using Noir.  

This project leverages [mpt-noirjs](https://github.com/RadNi/mpt-noirjs/tree/main) to fetch account data directly from RPC and generate **Merkle Patricia Trie (MPT) proofs** via the UltraHonk proof system for the [mpt-noir](https://github.com/RadNi/mpt-noir) circuits.  

## ⚙️ How it Works

- To avoid browser memory limits, the prover uses **dynamic recursion**:  
  - Each layer of the MPT path is proved in a recursion step.  
  - The first step skips the recursion verifier and instead proves multiple layers at once as an optimization.  
- A dedicated `balance_proof` circuit validates both:  
  - The account’s **minimum balance**.  
  - The account owner’s **signature**.  

The resulting proof can then be submitted on-chain (e.g. to Hyperliquid).  
The front-end later retrieves and verifies this proof as needed.
Solidity contracts are in [zk-flexor-contracts](https://github.com/RadNi/zk-flexor-contracts) repo.

---

## 🚀 Getting Started

```bash
npm install
npm run build
npm start
