module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { stackscoreUserData } = req.body;

  if (!stackscoreUserData) {
    return res.status(400).json({ error: 'Missing stackscoreUserData' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are StackScore Planner GPT. Based on user input, return JSON plans A–D, each with apps (name, category, reasoning). Respond in raw JSON only. Do NOT wrap your response in markdown or code blocks.',
          },
          {
            role: 'user',
            content: `User data: ${JSON.stringify(stackscoreUserData)}. Respond ONLY in pure JSON — no explanation, no markdown, no extra formatting.`,
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();
    console.log('🔍 OpenAI FULL raw response:', JSON.stringify(data, null, 2));

    let reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: 'No GPT response',
        openaiRaw: data,
      });
    }

    // ✅ Clean: Remove markdown code fences + extra quotes
    reply = reply.trim();

    // Handle wrapped in backticks
    if (reply.startsWith('```')) {
      reply = reply.replace(/```json|```/g, '').trim();
    }

    // Handle reply being stringified JSON (double escaped)
    if (reply.startsWith('"') && reply.endsWith('"')) {
      reply = reply.slice(1, -1); // remove outer quotes
      reply = reply.replace(/\\"/g, '"'); // unescape quotes
    }

    try {
      const parsed = JSON.parse(reply);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error('⚠️ Failed to parse GPT response as JSON:', reply);
      return res.status(200).json({ raw: reply });
    }

  } catch (err) {
    console.error('❌ GPT API error:', err);
    return res.status(500).json({ error: err.message || 'GPT API failed' });
  }
};





