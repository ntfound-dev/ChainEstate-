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

  try {
    const generalChat = new GeneralChat({ apiKey })
    const response = await generalChat.createChatBlob({
      question,
      chatHistory: 'on',
      sdkUniqueId,
      useCustomContext: true,
      contextInjection: {
        companyName: 'ChainEstate',
        companyDescription: CHAINESTATE_CONTEXT + pageHint,
        purpose:
          'You are the ChainEstate AI Copilot — a helpful, friendly assistant embedded in the ChainEstate app. ' +
          'CRITICAL RULES:\n' +
          '1. ALWAYS reply in the exact same language the user writes in. If they write Indonesian, reply in Indonesian. If English, reply in English. Never switch languages.\n' +
          '2. Keep answers SHORT and conversational. For simple questions or casual messages, 1-3 sentences max. Only give long detailed answers when the user specifically asks for details or explanations.\n' +
          '3. Be natural and friendly like a knowledgeable friend, not a formal assistant reading from a manual.\n' +
          '4. When asked about specific ChainEstate data (property yields, prices, contract addresses, staking tiers, etc.), give exact numbers from the knowledge base.\n' +
          '5. If the user says something casual or short (like "ok", "berarti nyata ya", "mantap", etc.), respond naturally and briefly — do NOT launch into a product explanation.\n' +
          '6. You have full knowledge of all 5 properties, CEST token, contracts, buy/sell flows, rent, airdrop, faucet, and all docs. Never say you lack context.\n' +
          '7. For blockchain transactions, you cannot look up live data — but you can explain where and how to verify (Arbiscan at sepolia.arbiscan.io).',
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
