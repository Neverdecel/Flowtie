import { Router } from 'express';
import { z } from 'zod';
import { db } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

const createABTestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  variants: z.array(z.object({
    name: z.string().min(1),
    promptId: z.string(),
    traffic: z.number().min(0).max(1),
  })).min(2),
});

const updateABTestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'RUNNING', 'COMPLETED', 'PAUSED']).optional(),
  trafficSplit: z.record(z.number()).optional(),
});

const recordResultSchema = z.object({
  variantId: z.string(),
  sessionId: z.string(),
  userId: z.string().optional(),
  success: z.boolean(),
  latency: z.number().optional(),
  feedback: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

router.use(authenticate);

router.get('/project/:projectId', async (req: AuthRequest, res) => {
  try {
    const project = await db.project.findFirst({
      where: {
        id: req.params.projectId,
        ownerId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const abTests = await db.aBTest.findMany({
      where: { projectId: req.params.projectId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        variants: {
          include: {
            prompt: {
              select: { id: true, name: true, version: true },
            },
            _count: {
              select: { results: true },
            },
          },
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ abTests });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, projectId, variants } = 
      createABTestSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalTraffic = variants.reduce((sum, v) => sum + v.traffic, 0);
    if (Math.abs(totalTraffic - 1.0) > 0.001) {
      return res.status(400).json({ 
        error: 'Variant traffic splits must sum to 1.0' 
      });
    }

    const promptIds = variants.map(v => v.promptId);
    const prompts = await db.prompt.findMany({
      where: {
        id: { in: promptIds },
        projectId,
      },
    });

    if (prompts.length !== promptIds.length) {
      return res.status(400).json({ 
        error: 'One or more prompts not found in this project' 
      });
    }

    const abTest = await db.aBTest.create({
      data: {
        name,
        description,
        projectId,
        creatorId: req.user!.id,
        trafficSplit: variants.reduce((acc, v) => {
          acc[v.name] = v.traffic;
          return acc;
        }, {} as Record<string, number>),
        variants: {
          create: variants.map(variant => ({
            name: variant.name,
            promptId: variant.promptId,
            traffic: variant.traffic,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        variants: {
          include: {
            prompt: {
              select: { id: true, name: true, version: true },
            },
            _count: {
              select: { results: true },
            },
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    io.to(`project:${projectId}`).emit('ab-test-created', { abTest });

    res.status(201).json({ abTest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const abTest = await db.aBTest.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        variants: {
          include: {
            prompt: {
              select: { id: true, name: true, content: true, version: true },
            },
            _count: {
              select: { results: true },
            },
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    if (!abTest || abTest.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    res.json({ abTest });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description, status, trafficSplit } = 
      updateABTestSchema.parse(req.body);

    const abTest = await db.aBTest.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!abTest || abTest.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    const updatedABTest = await db.aBTest.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(trafficSplit && { trafficSplit }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        variants: {
          include: {
            prompt: {
              select: { id: true, name: true, version: true },
            },
            _count: {
              select: { results: true },
            },
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    io.to(`project:${abTest.project.id}`).emit('ab-test-updated', { 
      abTest: updatedABTest 
    });

    res.json({ abTest: updatedABTest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/results', async (req: AuthRequest, res) => {
  try {
    const { variantId, sessionId, userId, success, latency, feedback, metadata } = 
      recordResultSchema.parse(req.body);

    const abTest = await db.aBTest.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { ownerId: true },
        },
        variants: {
          where: { id: variantId },
        },
      },
    });

    if (!abTest || abTest.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (abTest.variants.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const result = await db.aBTestResult.create({
      data: {
        abTestId: req.params.id,
        variantId,
        sessionId,
        userId,
        success,
        latency,
        feedback: feedback || {},
        metadata: metadata || {},
      },
    });

    res.status(201).json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/analytics', async (req: AuthRequest, res) => {
  try {
    const abTest = await db.aBTest.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { ownerId: true },
        },
      },
    });

    if (!abTest || abTest.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    const analytics = await db.aBTestResult.groupBy({
      by: ['variantId'],
      where: { abTestId: req.params.id },
      _count: {
        _all: true,
      },
      _avg: {
        latency: true,
      },
    });

    const successRates = await db.aBTestResult.groupBy({
      by: ['variantId', 'success'],
      where: { abTestId: req.params.id },
      _count: {
        _all: true,
      },
    });

    const variants = await db.aBTestVariant.findMany({
      where: { abTestId: req.params.id },
      include: {
        prompt: {
          select: { name: true },
        },
      },
    });

    const variantAnalytics = variants.map(variant => {
      const totalResults = analytics.find(a => a.variantId === variant.id)?._count._all || 0;
      const successCount = successRates.find(sr => 
        sr.variantId === variant.id && sr.success === true
      )?._count._all || 0;
      const avgLatency = analytics.find(a => a.variantId === variant.id)?._avg.latency || 0;

      return {
        variantId: variant.id,
        variantName: variant.name,
        promptName: variant.prompt.name,
        totalResults,
        successCount,
        successRate: totalResults > 0 ? successCount / totalResults : 0,
        avgLatency,
      };
    });

    res.json({ analytics: variantAnalytics });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;