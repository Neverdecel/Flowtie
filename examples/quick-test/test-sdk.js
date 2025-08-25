const { FlowTie } = require('@flowtie/sdk-js');

// Test the Flowtie SDK with live data
async function testFlowtie() {
  console.log('🧪 Testing Flowtie SDK with live data...\n');

  const flowtie = new FlowTie({
    apiUrl: 'http://localhost:3001',
    apiKey: 'demo-project-id', // Using project ID as API key for demo
    projectId: 'demo-project-id',
    enableRealtime: true,
    cachePrompts: true,
  });

  try {
    // Initialize connection
    console.log('🔌 Connecting to Flowtie...');
    await flowtie.initialize();
    console.log('✅ Connected successfully!\n');

    // Test 1: Get a simple prompt with variables
    console.log('📝 Test 1: Getting welcome message prompt');
    const welcomeMessage = await flowtie.getPrompt('welcome-message', {
      variables: {
        company: 'Demo Company',
        assistantName: 'Alex',
        userName: 'Sarah'
      },
      sessionId: 'test-session-1'
    });
    console.log('Result:');
    console.log(welcomeMessage);
    console.log('\n');

    // Test 2: Get system prompt
    console.log('📝 Test 2: Getting system prompt');
    const systemPrompt = await flowtie.getPrompt('system-prompt', {
      variables: {
        company: 'TechCorp',
        assistantName: 'Assistant',
        userName: 'John'
      },
      sessionId: 'test-session-2'
    });
    console.log('Result:');
    console.log(systemPrompt);
    console.log('\n');

    // Test 3: A/B test the welcome message
    console.log('🧪 Test 3: Running A/B test for welcome messages');
    for (let i = 0; i < 5; i++) {
      const result = await flowtie.getABTestPrompt('Welcome Message Test', {
        variables: {
          company: 'TestCorp',
          assistantName: 'Bot',
          userName: `User${i + 1}`
        },
        sessionId: `ab-test-session-${i}`,
        userId: `user-${i}`
      });

      console.log(`Test ${i + 1}:`);
      console.log(`Variant: ${result.variantId}`);
      console.log(`Content: ${result.promptContent.slice(0, 100)}...`);
      console.log('');
    }

    // Test 4: Listen for real-time updates
    console.log('🔄 Test 4: Setting up real-time listeners');
    flowtie.on('prompt-updated', (event) => {
      console.log(`🔄 Hot reload: Prompt "${event.prompt?.name}" updated!`);
    });

    flowtie.on('ab-test-updated', (event) => {
      console.log(`🧪 A/B test "${event.abTest?.name}" updated!`);
    });

    console.log('✅ Real-time listeners active (try updating prompts in the dashboard!)');
    console.log('\n');

    // Test 5: Error handling
    console.log('🚨 Test 5: Testing error handling');
    try {
      await flowtie.getPrompt('non-existent-prompt', {
        sessionId: 'error-test'
      });
    } catch (error) {
      console.log('✅ Error handling works:', error.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('💡 Try updating prompts in the dashboard to see hot reloading in action!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testFlowtie();