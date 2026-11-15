import { Router, Request, Response } from 'express';
import { ForexService } from '../services/forex.service.js';

const router = Router();

router.get('/rates', (_req: Request, res: Response) => {
  const data = ForexService.getIndicativeRates();
  res.status(200).json(data);
});

router.get('/convert', (req: Request, res: Response) => {
  const amount = Number(req.query.amount);
  const currency = String(req.query.currency || 'USD');
  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Valid positive amount in ETB is required' });
    return;
  }
  try {
    const result = ForexService.convertFromETB(amount, currency);
    res.status(200).json({
      amountETB: amount,
      targetCurrency: currency,
      convertedAmount: result.amount,
      exchangeRate: result.rate,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
