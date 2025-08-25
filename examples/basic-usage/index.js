const { FlowTie } = require('@flowtie/sdk-js');

const flowtie = new FlowTie({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key-here',
  projectId: 'your-project-id',
  enableRealtime: true,
  cachePrompts: true,
});

async function main() {
  try {
    await flowtie.initialize();
    console.log('✅ Flowtie initialized');

    const welcomePrompt = await flowtie.getPrompt('welcome-message', {
      variables: {
        name: 'John',
        company: 'Acme Corp'
      },
      sessionId: 'session-123'
    });
    
    console.log('Welcome prompt:', welcomePrompt);

    const abTestResult = await flowtie.getABTestPrompt('onboarding-flow', {
      variables: {
        name: 'John',
        plan: 'premium'
      },
      userId: 'user-456',
      sessionId: 'session-123'
    });

    console.log('A/B test result:', abTestResult.promptContent);
    console.log('Variant ID:', abTestResult.variantId);

    await flowtie.recordFeedback(
      'ab-test-id',
      abTestResult.variantId,
      true,
      { rating: 5, conversion: true },
      'session-123'
    );

    flowtie.on('prompt-updated', (event) => {
      console.log('🔄 Prompt updated:', event.prompt.name);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();