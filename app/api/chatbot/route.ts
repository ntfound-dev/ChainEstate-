import { NextRequest, NextResponse } from 'next/server'
import { GeneralChat } from '@chaingpt/generalchat'
import {
  AI_TONE,
  BLOCKCHAIN_NETWORK,
  PRE_SET_TONES,
} from '@chaingpt/generalchat/dist/enum/context.enum.js'
import { CHAINESTATE_CONTEXT } from '../../lib/chatbotContext'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const apiKey = process.env.CHAINGPT_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'CHAINGPT_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  const sdkUniqueId = typeof body?.sdkUniqueId === 'string' ? body.sdkUniqueId : undefined
  const currentPage = typeof body?.currentPage === 'string' ? body.currentPage : ''

  if (!question) {
    return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
  }

  const pageHint = currentPage ? `\nUser is currently on page: ${currentPage}` : ''

  // Wrap the question in ChainEstate DeFi framing so ChainGPT doesn't
  // reject "real estate" topics as out-of-scope. All ChainEstate concepts
  // are DeFi/blockchain: property tokens = ERC-7984 DeFi tokens,
  // yields = token APY, properties = tokenized RWA assets on Arbitrum Sepolia.
  const wrappedQuestion =
    `[ChainEstate DeFi platform — Arbitrum Sepolia — ERC-7984 confidential RWA tokens] ${question}`

  try {
    const generalChat = new GeneralChat({ apiKey })
    const response = await generalChat.createChatBlob({
      question: wrappedQuestion,
      chatHistory: 'on',
      sdkUniqueId,
      useCustomContext: true,
      contextInjection: {
        companyName: 'ChainEstate',
        companyDescription: CHAINESTATE_CONTEXT + pageHint,
        purpose:
          'You are the ChainEstate AI Copilot embedded inside a DeFi application. ' +
          'ChainEstate is a blockchain-based RWA (Real World Asset) tokenization platform on Arbitrum Sepolia. ' +
          'All "property" questions are DeFi token questions — property tokens are ERC-7984 confidential tokens, ' +
          'yields are token APY, buying is on-chain USDT transactions, balances are encrypted via iExec Nox TEE. ' +
          'EVERYTHING in ChainEstate is a blockchain/crypto topic — never say it is out of scope.\n\n' +
          'RULES:\n' +
          '1. ALWAYS reply in the same language the user writes. Indonesian → Indonesian. English → English.\n' +
          '2. Short casual messages get short natural replies (1-3 sentences). No info dumps unless user asks.\n' +
          '3. Be friendly and direct like a knowledgeable friend, not a formal manual.\n' +
          '4. Give exact numbers: property APYs, prices, contract addresses, staking amounts from the knowledge base.\n' +
          '5. Never claim a topic is outside your scope — you know all ChainEstate products fully.\n' +
          '6. For live blockchain data (specific tx hashes) you cannot look up — point to sepolia.arbiscan.io.',
        cryptoToken: true,
        tokenInformation: {
          tokenName: 'ChainEstate Token',
          tokenSymbol: 'CEST',
          blockchain: [BLOCKCHAIN_NETWORK.ARBITRUM],
        },
        limitation: false,
        aiTone: AI_TONE.PRE_SET_TONE,
        selectedTone: PRE_SET_TONES.FRIENDLY,
      },
    })

    const answer =
      response?.data?.bot ??
      response?.data?.answer ??
      response?.data?.message ??
      'ChainGPT did not return a message.'

    return NextResponse.json({ answer })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'ChainGPT request failed.',
      },
      { status: 500 }
    )
  }
}
