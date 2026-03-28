import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${process.env.TWELVE_DATA_API_KEY || '7b34c99d560f479292177a996c04d5e3'}`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    return NextResponse.json({
      symbol: 'XAU/USD',
      price: data.price || null,
      error: data.message || null,
    })
  } catch (error) {
    return NextResponse.json({ symbol: 'XAU/USD', price: null, error: String(error) }, { status: 500 })
  }
}
