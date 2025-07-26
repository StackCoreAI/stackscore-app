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
            content: 'You are StackScore Planner GPT. Based on user input, return JSON plans A–D with credit-building apps, categories, and reasoning.',
          },
          {
            role: 'user',
            content: `User data: ${JSON.stringify(stackscoreUserData)}. Respond ONLY in raw JSON format with 4 top-level keys: planA, planB, planC, and planD. Do not include explanations or extra text.`,

          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();
console.log('🔍 OpenAI response:', JSON.stringify(data, null, 2));

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'No GPT response' });
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

  }
}
