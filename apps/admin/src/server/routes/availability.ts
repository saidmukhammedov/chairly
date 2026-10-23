import { Router, Request, Response } from 'express';
import { validateQuery } from '../middlewares/validate';
import { GetAvailabilityQuerySchema } from '@chairly/shared';
import { getAvailableSlots } from '../services/availability';

const router = Router();

router.get('/', validateQuery(GetAvailabilityQuerySchema), async (req: Request, res: Response, next) => {
  try {
    const { shopId, serviceId, barberId, date } = req.query as any;

    const slots = await getAvailableSlots({
      shopId,
      serviceId,
      barberId: barberId || undefined,
      dateStr: date,
    });

    res.json(slots);
  } catch (err) {
    next(err);
  }
});

export default router;
