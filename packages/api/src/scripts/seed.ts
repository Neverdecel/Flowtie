import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create demo users
    const demoUser = await db.user.upsert({
      where: { email: 'demo@flowtie.dev' },
      update: {},
      create: {
        email: 'demo@flowtie.dev',
        name: 'Demo User',
        password: await hashPassword('password123'),
        role: 'USER',
      },
    });

    const adminUser = await db.user.upsert({
      where: { email: 'admin@flowtie.dev' },
      update: {},
      create: {
        email: 'admin@flowtie.dev',
        name: 'Admin User', 
        password: await hashPassword('admin123'),
        role: 'ADMIN',
      },
    });

    console.log('✅ Created users');

    // Create demo project
    const demoProject = await db.project.upsert({
      where: { 
        id: 'demo-project-id'
      },
      update: {},
      create: {
        id: 'demo-project-id',
        name: 'AI Chatbot Demo',
        description: 'Sample project showcasing Flowtie prompt management',
        ownerId: demoUser.id,
      },
    });

    console.log('✅ Created demo project');

    // Create sample prompts
    const systemPrompt = await db.prompt.upsert({
      where: {
        projectId_name_version: {
          projectId: demoProject.id,
          name: 'system-prompt',
          version: 1,
        },
      },
      update: {},
      create: {
        name: 'system-prompt',
        description: 'Main system prompt for the AI assistant',
        content: `You are a helpful AI assistant for {{company}}. Your name is {{assistantName}}.

Key guidelines:
- Be friendly and professional
- Always try to help the user
- If you don't know something, admit it
- Keep responses concise but informative
- Use the user's name {{userName}} when appropriate

Remember: You're representing {{company}} - maintain a positive brand image!`,
        variables: {
          company: 'Acme Corp',
          assistantName: 'Alex',
          userName: 'User'
        },
        status: 'PUBLISHED',
        projectId: demoProject.id,
        authorId: demoUser.id,
      },
    });

    const welcomePrompt = await db.prompt.upsert({
      where: {
        projectId_name_version: {
          projectId: demoProject.id,
          name: 'welcome-message',
          version: 1,
        },
      },
      update: {},
      create: {
        name: 'welcome-message',
        description: 'Welcome message for new users',
        content: `👋 Welcome to {{company}}, {{userName}}! 

I'm {{assistantName}}, your AI assistant. I'm here to help you with:
• Answering questions about our products
• Providing customer support
• Helping you navigate our services

How can I assist you today?`,
        variables: {
          company: 'Acme Corp',
          assistantName: 'Alex',
          userName: 'John'
        },
        status: 'PUBLISHED',
        projectId: demoProject.id,
        authorId: demoUser.id,
      },
    });

    // Create alternative welcome message for A/B testing
    const welcomePromptV2 = await db.prompt.upsert({
      where: {
        projectId_name_version: {
          projectId: demoProject.id,
          name: 'welcome-message-casual',
          version: 1,
        },
      },
      update: {},
      create: {
        name: 'welcome-message-casual',
        description: 'Casual welcome message variant',
        content: `Hey {{userName}}! 🎉

Welcome to {{company}}! I'm {{assistantName}}, and I'm super excited to help you out today.

What can I do for you? I'm pretty good at:
- Answering questions (I know lots of stuff!)
- Helping with support issues
- Making your life easier

Just ask me anything!`,
        variables: {
          company: 'Acme Corp',
          assistantName: 'Alex',
          userName: 'John'
        },
        status: 'PUBLISHED',
        projectId: demoProject.id,
        authorId: demoUser.id,
      },
    });

    const errorPrompt = await db.prompt.upsert({
      where: {
        projectId_name_version: {
          projectId: demoProject.id,
          name: 'error-message',
          version: 1,
        },
      },
      update: {},
      create: {
        name: 'error-message',
        description: 'Error handling message',
        content: `I apologize, but I'm experiencing some technical difficulties right now. 

{{#if isTemporary}}
This appears to be a temporary issue. Please try again in a few moments.
{{else}}
Please contact our support team at {{supportEmail}} for assistance.
{{/if}}

Error Reference: {{errorId}}`,
        variables: {
          isTemporary: true,
          supportEmail: 'support@acme.com',
          errorId: 'ERR-001'
        },
        status: 'PUBLISHED',
        projectId: demoProject.id,
        authorId: demoUser.id,
      },
    });

    console.log('✅ Created sample prompts');

    // Create A/B test
    const welcomeTest = await db.aBTest.upsert({
      where: { id: 'welcome-ab-test' },
      update: {},
      create: {
        id: 'welcome-ab-test',
        name: 'Welcome Message Test',
        description: 'Testing formal vs casual welcome messages',
        status: 'RUNNING',
        trafficSplit: {
          formal: 0.5,
          casual: 0.5,
        },
        projectId: demoProject.id,
        creatorId: demoUser.id,
      },
    });

    // Create A/B test variants
    await db.aBTestVariant.upsert({
      where: {
        abTestId_name: {
          abTestId: welcomeTest.id,
          name: 'formal',
        },
      },
      update: {},
      create: {
        name: 'formal',
        traffic: 0.5,
        abTestId: welcomeTest.id,
        promptId: welcomePrompt.id,
      },
    });

    await db.aBTestVariant.upsert({
      where: {
        abTestId_name: {
          abTestId: welcomeTest.id,
          name: 'casual',
        },
      },
      update: {},
      create: {
        name: 'casual',
        traffic: 0.5,
        abTestId: welcomeTest.id,
        promptId: welcomePromptV2.id,
      },
    });

    console.log('✅ Created A/B test');

    // Create some sample usage data
    const variants = await db.aBTestVariant.findMany({
      where: { abTestId: welcomeTest.id },
    });

    // Generate sample results
    for (let i = 0; i < 50; i++) {
      const variant = variants[Math.floor(Math.random() * variants.length)];
      const success = Math.random() > 0.3; // 70% success rate
      
      await db.aBTestResult.create({
        data: {
          abTestId: welcomeTest.id,
          variantId: variant.id,
          sessionId: `session-${i}`,
          userId: Math.random() > 0.5 ? demoUser.id : undefined,
          success,
          latency: Math.floor(Math.random() * 500) + 100, // 100-600ms
          feedback: success ? { helpful: true } : { helpful: false },
          metadata: {
            userAgent: 'Demo Browser',
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Generate sample prompt usage logs
    const prompts = [systemPrompt, welcomePrompt, welcomePromptV2, errorPrompt];
    
    for (let i = 0; i < 100; i++) {
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      const success = Math.random() > 0.15; // 85% success rate
      
      await db.promptUsage.create({
        data: {
          promptId: prompt.id,
          sessionId: `usage-session-${i}`,
          success,
          latency: Math.floor(Math.random() * 300) + 50, // 50-350ms
          tokens: Math.floor(Math.random() * 500) + 100, // 100-600 tokens
          cost: Math.random() * 0.01, // $0.001-$0.011
          metadata: {
            model: 'gpt-3.5-turbo',
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    console.log('✅ Created sample analytics data');

    // Create another project for the admin user
    const adminProject = await db.project.upsert({
      where: { 
        id: 'admin-project-id'
      },
      update: {},
      create: {
        id: 'admin-project-id',
        name: 'Customer Support Bot',
        description: 'Advanced support chatbot with escalation flows',
        ownerId: adminUser.id,
      },
    });

    // Add a few prompts to admin project
    await db.prompt.create({
      data: {
        name: 'escalation-prompt',
        description: 'When to escalate to human agents',
        content: `Based on the conversation context, I need to escalate this to a human agent because:

{{escalationReason}}

Please hold on while I connect you with one of our support specialists. Your ticket ID is: {{ticketId}}

Expected wait time: {{waitTime}} minutes.`,
        variables: {
          escalationReason: 'Complex technical issue requiring specialist knowledge',
          ticketId: 'TICKET-001',
          waitTime: '3-5'
        },
        status: 'DRAFT',
        projectId: adminProject.id,
        authorId: adminUser.id,
      },
    });

    console.log('✅ Created admin project and prompts');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo accounts created:');
    console.log('📧 demo@flowtie.dev / password123 (User)');
    console.log('📧 admin@flowtie.dev / admin123 (Admin)');
    console.log('\nDemo project created with:');
    console.log('• 4 sample prompts with variables');
    console.log('• 1 running A/B test (Welcome Message Test)');
    console.log('• 150+ analytics data points');
    console.log('• Multiple prompt versions and variants');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seed();