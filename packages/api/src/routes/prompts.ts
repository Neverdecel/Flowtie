import { Router } from 'express';
import { z } from 'zod';
import { db } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

const createPromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  variables: z.record(z.any()).optional(),
  projectId: z.string(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  variables: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
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

    const prompts = await db.prompt.findMany({
      where: { projectId: req.params.projectId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { versions: true, usageLogs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ prompts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, content, variables, projectId } = 
      createPromptSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingPrompt = await db.prompt.findFirst({
      where: {
        projectId,
        name,
      },
    });

    let prompt;
    if (existingPrompt) {
      const latestVersion = await db.prompt.findFirst({
        where: {
          projectId,
          name,
        },
        orderBy: { version: 'desc' },
      });

      prompt = await db.prompt.create({
        data: {
          name,
          description,
          content,
          variables: variables || {},
          projectId,
          authorId: req.user!.id,
          version: (latestVersion?.version || 0) + 1,
          parentId: existingPrompt.id,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { versions: true, usageLogs: true },
          },
        },
      });
    } else {
      prompt = await db.prompt.create({
        data: {
          name,
          description,
          content,
          variables: variables || {},
          projectId,
          authorId: req.user!.id,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { versions: true, usageLogs: true },
          },
        },
      });
    }

    io.to(`project:${projectId}`).emit('prompt-created', { prompt });

    res.status(201).json({ prompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const prompt = await db.prompt.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true, version: true },
        },
        versions: {
          select: { id: true, version: true, status: true, createdAt: true },
          orderBy: { version: 'desc' },
        },
        _count: {
          select: { versions: true, usageLogs: true },
        },
      },
    });

    if (!prompt || prompt.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description, content, variables, status } = 
      updatePromptSchema.parse(req.body);

    const prompt = await db.prompt.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!prompt || prompt.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const updatedPrompt = await db.prompt.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(variables && { variables }),
        ...(status && { status }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { versions: true, usageLogs: true },
        },
      },
    });

    io.to(`project:${prompt.project.id}`).emit('prompt-updated', { 
      prompt: updatedPrompt 
    });

    res.json({ prompt: updatedPrompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const prompt = await db.prompt.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!prompt || prompt.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    await db.prompt.delete({
      where: { id: req.params.id },
    });

    io.to(`project:${prompt.project.id}`).emit('prompt-deleted', { 
      promptId: req.params.id 
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/versions', async (req: AuthRequest, res) => {
  try {
    const prompt = await db.prompt.findFirst({
      where: { id: req.params.id },
      include: {
        project: {
          select: { ownerId: true },
        },
      },
    });

    if (!prompt || prompt.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const versions = await db.prompt.findMany({
      where: {
        OR: [
          { id: req.params.id },
          { parentId: req.params.id },
        ],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    res.json({ versions });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;