import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongo'
import type { Driver } from '@/app/page'

type Category = 'above' | 'below'
type Round = 'setup' | 'qualification' | 'race1' | 'race2' | 'race3' | 'final'

interface EventState {
  category: Category
  availableKartNumbers: number[]
  drivers: Driver[]
  currentRound: Round
}

const DOC_ID = 'current'

export async function GET() {
  try {
    const db = await getDb()
    const doc = await db.collection('events').findOne<{ _id: string; state: EventState }>({ _id: DOC_ID })

    if (!doc) {
      return NextResponse.json(null)
    }

    return NextResponse.json(doc.state)
  } catch (error) {
    console.error('GET /api/event error', error)
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const state = (await request.json()) as EventState | null
    const db = await getDb()

    if (!state) {
      await db.collection('events').deleteOne({ _id: DOC_ID })
      return NextResponse.json({ ok: true })
    }

    await db
      .collection('events')
      .updateOne(
        { _id: DOC_ID },
        { $set: { state, updatedAt: new Date() } },
        { upsert: true },
      )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PUT /api/event error', error)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const db = await getDb()
    await db.collection('events').deleteOne({ _id: DOC_ID })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/event error', error)
    return NextResponse.json({ error: 'Failed to reset event' }, { status: 500 })
  }
}


