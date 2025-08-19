// Bulletproof: always returns 200 with a mock on failure
app.post('/api/gpt-plan', async (req, res) => {
    try {
      const answers = req.body?.answers || {};
      const forceMock = req.query.mock === '1' || !openai || process.env.MOCK_MODE === '1';
  
      if (forceMock) {
        // Guaranteed safe path
        return res.json(mockPlan(answers));
      }
  
      // Live path (OpenAI on)
      const skeleton = buildSkeleton(answers);
  
      let narratives;
      try {
        narratives = await getNarratives(answers, skeleton);
      } catch (err) {
        console.error('OpenAI failed → using fallback:', err?.status || '', err?.message || err);
        narratives = fallbackNarratives(derivePersona(answers));
      }
  
      const plans = skeleton.plans.map(p => ({ ...p, narrative: narratives[p.key] || '' }));
      return res.json({ plans });
    } catch (err) {
      // Outer catch: even unexpected errors return a mock with 200
      console.error('/api/gpt-plan outer fail → returning mock:', err);
      return res.status(200).json(mockPlan(req.body?.answers || {}));
    }
  });
  