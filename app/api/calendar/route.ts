import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const oneYearLater = new Date()
  oneYearLater.setFullYear(now.getFullYear() + 1)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: oneYearLater.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json({ error: data.error }, { status: response.status })
  }

  const events = (data.items || []).map((event: any) => ({
    id: event.id,
    cliente_nome: event.summary || 'Sem título',
    tipo: 'Google Calendar',
    data: event.start?.date || event.start?.dateTime?.split('T')[0],
    horario_inicio: event.start?.dateTime?.split('T')[1]?.slice(0, 5) || '00:00',
    horario_fim: event.end?.dateTime?.split('T')[1]?.slice(0, 5) || '00:00',
    local: event.location || '',
    status: 'Agendado',
    observacoes: event.description || '',
    origem: 'google',
  }))

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { summary, description, start, end, location } = await req.json()

  const event = {
    summary,
    description,
    location,
    start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: end, timeZone: 'America/Sao_Paulo' },
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json({ error: data.error }, { status: response.status })
  }

  return NextResponse.json({ success: true, eventId: data.id })
}