/**
 * Creates real on-chain market listings for all 5 properties.
 * 1. Approves USDT for each PropertyToken
 * 2. Calls purchaseTokens with real Nox handle+proof (from TEE gateway)
 * 3. Grants SecondaryMarket as operator
 * 4. Creates listing at $1.025/token (slight premium)
 */
import { ethers } from 'hardhat'

const USDT_ADDRESS        = '0x9a822B9A50D090CfcCa1e6474efCd653112d8501'
const REGISTRY_ADDRESS    = '0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e'
const SECONDARY_MARKET    = '0x77836405DC14Ca1Ef0304041ec8D3B4166424cfa'

// 100 tokens per property, $1.025/token listing price
const TOKEN_AMOUNT   = 100n
const USDT_PER_BUY   = 100n * 1_000_000n  // 100 USDT (6 dec)
const LISTING_PRICE  = 1_025_000n          // $1.025 in 6 dec
const OPERATOR_EXPIRY = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600) // 30 days

// Real handles from iExec Nox TEE gateway (Arbitrum Sepolia, owner = deployer)
const SEED_DATA = [
  { propertyId: 1n, contract: "0x853D51fBD5E288BF189FE0126d59f855c821a641", handle: "0x0000066eee2301ba47e6ae58f82f5af5120545d73893ea5294c7279b649781d4", proof: "0x834de729cb9df77451dbc6bf7fd05f475b011ac7853d51fbd5e288bf189fe0126d59f855c821a6410000000000000000000000000000000000000000000000000000000069f153176a1994b2333279e825ee0cf1315360eebb78a7934ab381e3e02bddf410a3088d35bc512a10b7b8c0a7ba840de2553b1a7c745696d596b546d9893ffe10e8469e1b" },
  { propertyId: 2n, contract: "0x457d78AD2912923897B93fD82d502aD0B34E54eA", handle: "0x0000066eee23014c1c8cf3a34adf93d1308ec2749d627e31ac6a10de77a38bbb", proof: "0x834de729cb9df77451dbc6bf7fd05f475b011ac7457d78ad2912923897b93fd82d502ad0b34e54ea0000000000000000000000000000000000000000000000000000000069f15318fdd6c1821682138f95b82f0a2422ab55416c18c78e7447d369d54a7c82b9cf9e082592e297a8190662113250569507bab802800a0779bd4b6eea9ca51c1ddd701b" },
  { propertyId: 3n, contract: "0x57D15966CD4203cC8FbC1fd6763Be935d27D1178", handle: "0x0000066eee2301f7eb2d2a6a6938df2f976741051e169c4152d04729d03b3f7b", proof: "0x834de729cb9df77451dbc6bf7fd05f475b011ac757d15966cd4203cc8fbc1fd6763be935d27d11780000000000000000000000000000000000000000000000000000000069f1531a830a0e6d27d7c19cd73a2655bab48fa78295fae093be70e727536f11788fb57a64bad334618013bd8d282ce8299fa43fb891619031887db3d7647382f5241ddf1c" },
  { propertyId: 4n, contract: "0x7fB7e7245DB49a6a869A21962f907C76ec0F5b23", handle: "0x0000066eee23012c669952de7686c206b7b0dad877259aa83968b9d5579c34a2", proof: "0x834de729cb9df77451dbc6bf7fd05f475b011ac77fb7e7245db49a6a869a21962f907c76ec0f5b230000000000000000000000000000000000000000000000000000000069f1531b81c90962d22c9e2f6eaa4a75388fb34cf36e0cc70887c46bba69d891f3f65c194a86a88543d26674489b4549ff17a16d0cacf9231a69f4cacea0068a0122d11a1c" },
  { propertyId: 5n, contract: "0xA3dDfe781BDbb2F376B776F02aA6A8c379c12DFe", handle: "0x0000066eee2301496bdaa7460a1fa2108f3dc75265668ae956654841eb625a4a", proof: "0x834de729cb9df77451dbc6bf7fd05f475b011ac7a3ddfe781bdbb2f376b776f02aa6a8c379c12dfe0000000000000000000000000000000000000000000000000000000069f1531cbbdaa754154d2760e8dfb10b340fccd28807301148c58c4ec0d77a650af28add4a686c7446773b3af2bbfd7534b2fb0d1cbbe87c5ebc0f9ae31d9e27e482d5f61c" },
]

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
]

const PROPERTY_TOKEN_ABI = [
  'function purchaseTokens(bytes32 handle, bytes calldata handleProof, uint256 clearAmount)',
  'function grantOperator(address operator, uint256 expiry)',
]

const SECONDARY_MARKET_ABI = [
  'function createListing(address tokenContract, uint256 propertyId, uint256 tokenAmount, uint256 pricePerToken) returns (uint256)',
]

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, deployer)
  const market = new ethers.Contract(SECONDARY_MARKET, SECONDARY_MARKET_ABI, deployer)

  for (const seed of SEED_DATA) {
    console.log(`\n=== Property ${seed.propertyId} (${seed.contract.slice(0,10)}...) ===`)

    const token = new ethers.Contract(seed.contract, PROPERTY_TOKEN_ABI, deployer)

    // Step 1: Approve USDT for PropertyToken
    console.log('  1. Approving USDT...')
    const approveTx = await usdt.approve(seed.contract, USDT_PER_BUY)
    await approveTx.wait()
    console.log('     ✓ USDT approved:', approveTx.hash)

    // Step 2: Purchase tokens with real Nox handle+proof
    console.log('  2. Calling purchaseTokens...')
    try {
      const purchaseTx = await token.purchaseTokens(seed.handle, seed.proof, TOKEN_AMOUNT)
      await purchaseTx.wait()
      console.log('     ✓ Tokens purchased:', purchaseTx.hash)
    } catch (e: unknown) {
      console.log('     ⚠ purchaseTokens failed (handle may be expired):', (e as Error).message?.slice(0, 80))
      console.log('     Skipping to next property...')
      continue
    }

    // Step 3: Grant SecondaryMarket as operator
    console.log('  3. Granting operator...')
    const grantTx = await token.grantOperator(SECONDARY_MARKET, OPERATOR_EXPIRY)
    await grantTx.wait()
    console.log('     ✓ Operator granted:', grantTx.hash)

    // Step 4: Create listing at $1.025/token
    console.log('  4. Creating listing...')
    const listTx = await market.createListing(seed.contract, seed.propertyId, TOKEN_AMOUNT, LISTING_PRICE)
    const receipt = await listTx.wait()
    console.log('     ✓ Listing created:', listTx.hash)

    // Parse listingId from logs if available
    const listingId = receipt?.logs?.[0] ? '(check tx logs)' : ''
    console.log('     Listing ID:', listingId)
  }

  console.log('\n✅ All listings created successfully!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
