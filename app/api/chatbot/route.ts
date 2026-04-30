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

  if (!question) {
    return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
  }

  try {
    const generalChat = new GeneralChat({ apiKey })
    const response = await generalChat.createChatBlob({
      question,
      chatHistory: 'on',
      sdkUniqueId,
      useCustomContext: true,
      contextInjection: {
        companyName: 'ChainEstate',
        companyDescription: CHAINESTATE_CONTEXT,
        purpose:
          'You are the ChainEstate AI Copilot. Answer questions about ChainEstate products, properties, ' +
          'token prices, yields, contract addresses, how to buy/sell/trade, iExec Nox privacy architecture, ' +
          'CEST tokenomics, staking tiers, rent distribution, the airdrop, faucet, roadmap, and all docs. ' +
          'Be specific — cite exact property names, yields, prices, and contract addresses from the knowledge base. ' +
          'If asked about a specific property, give its full details. ' +
          'If asked how to get started, explain the faucet → buy flow. ' +
          'Never say you lack context about ChainEstate — you have the full product knowledge base.',
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
