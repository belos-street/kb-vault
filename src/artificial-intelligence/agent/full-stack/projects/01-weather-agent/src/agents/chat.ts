export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callModel(input: {
  messages: ChatMessage[]
  signal: AbortSignal
}): Promise<string> {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('missing LLM_API_KEY')

  const baseUrl = (
    process.env.LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    'https://api.openai.com/v1'
  ).replace(/\/+$/, '')

  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model:
        process.env.LLM_MODEL ??
        process.env.DEFAULT_MODEL ??
        'gpt-4o-mini',
      messages: input.messages
    }),
    signal: input.signal
  })

  if (!response.ok) {
    const error = new Error('upstream ' + response.status)
    Object.assign(error, { status: response.status })
    throw error
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content ?? ''
}
