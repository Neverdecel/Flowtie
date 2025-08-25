import { Router } from 'express';
import { z } from 'zod';
import { db } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const projects = await db.project.findMany({
      where: { ownerId: req.user!.id },
      include: {
        _count: {
          select: { prompts: true, abTests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description } = createProjectSchema.parse(req.body);

    const project = await db.project.create({
      data: {
        name,
        description,
        ownerId: req.user!.id,
      },
      include: {
        _count: {
          select: { prompts: true, abTests: true },
        },
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await db.project.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user!.id,
      },
      include: {
        _count: {
          select: { prompts: true, abTests: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description } = updateProjectSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await db.project.update({
      where: { id: req.params.id },
      data: { name, description },
      include: {
        _count: {
          select: { prompts: true, abTests: true },
        },
      },
    });

    res.json({ project: updatedProject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await db.project.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.project.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;