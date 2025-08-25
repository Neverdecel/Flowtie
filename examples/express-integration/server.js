const express = require('express');
const { FlowTie } = require('@flowtie/sdk-js');

const app = express();
app.use(express.json());

const flowtie = new FlowTie({
  apiUrl: process.env.FLOWTIE_API_URL || 'http://localhost:3001',
  apiKey: process.env.FLOWTIE_API_KEY,
  projectId: process.env.FLOWTIE_PROJECT_ID,
  enableRealtime: true,
  cachePrompts: true,
});

async function initializeFlowtie() {
  try {
    await flowtie.initialize();
    console.log('✅ Flowtie connected and ready');
  } catch (error) {
    console.error('❌ Failed to initialize Flowtie:', error);
    process.exit(1);
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    const systemPrompt = await flowtie.getPrompt('chat-system-prompt', {
      variables: { userType: 'premium' },
      sessionId,
      userId,
      metadata: { endpoint: '/api/chat' }
    });

    const aiResponse = await simulateAIResponse(systemPrompt + '\n\nUser: ' + message);

    const responsePrompt = await flowtie.getABTestPrompt('response-formatting', {
      variables: {
        response: aiResponse,
        tone: 'friendly'
      },
      sessionId,
      userId
    });

    res.json({
      response: responsePrompt.promptContent,
      variantId: responsePrompt.variantId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { abTestId, variantId, sessionId, userId, rating, helpful } = req.body;

    await flowtie.recordFeedback(
      abTestId,
      variantId,
      helpful,
      { rating, helpful },
      sessionId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/prompts/reload', async (req, res) => {
  try {
    await flowtie.initialize();
    res.json({ message: 'Prompts reloaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reload prompts' });
  }
});

async function simulateAIResponse(prompt) {
  return `This is a simulated AI response to: "${prompt.slice(-50)}..."`;
}

flowtie.on('prompt-updated', (event) => {
  console.log(`🔄 Hot reload: Prompt "${event.prompt.name}" updated`);
});

flowtie.on('ab-test-updated', (event) => {
  console.log(`🧪 A/B test "${event.abTest.name}" configuration updated`);
});

const PORT = process.env.PORT || 3002;

initializeFlowtie().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Hot reloading enabled for prompts`);
  });
});