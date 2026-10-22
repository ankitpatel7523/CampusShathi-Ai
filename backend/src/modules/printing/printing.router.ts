import { Router, Response } from 'express';
import { db } from '../../../../server/db.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js';
import { PrintOrderSchema } from '../../../../shared/schemas/index.js';

export const printingRouter = Router();


// Pricing calculator helper
export function calculatePrintCost(params: {
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
  printSides: 'single' | 'double';
  bindingType: 'staple' | 'spiral' | 'hardbound';
  urgency: 'regular' | 'express_morning_9am';
}) {
  const { pages, copies, colorMode, printSides, bindingType, urgency } = params;

  let pageRate = 0.8; // default: B&W back-to-back
  if (colorMode === 'bw') {
    pageRate = printSides === 'single' ? 1.0 : 0.8;
  } else {
    pageRate = printSides === 'single' ? 3.0 : 2.2;
  }

  const printingSubtotal = pages * pageRate * copies;

  let bindingCost = 0;
  if (bindingType === 'spiral') bindingCost = 25 * copies;
  else if (bindingType === 'hardbound') bindingCost = 120 * copies;

  const expressFee = urgency === 'express_morning_9am' ? 15 : 0;
  const platformDeliveryFee = 10; // Nominal campus delivery fee

  const total = Math.round((printingSubtotal + bindingCost + expressFee + platformDeliveryFee) * 10) / 10;

  return {
    printingSubtotal: Math.round(printingSubtotal * 10) / 10,
    bindingCost,
    expressFee,
    platformDeliveryFee,
    pageRate,
    totalAmount: total
  };
}

// POST calculate price preview
printingRouter.post('/calculate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pages = 10, copies = 1, colorMode = 'bw', printSides = 'double', bindingType = 'staple', urgency = 'regular' } = req.body;
    const breakdown = calculatePrintCost({ pages, copies, colorMode, printSides, bindingType, urgency });
    res.json(breakdown);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET user orders
printingRouter.get('/orders', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const orders = db.prepare('SELECT * FROM print_orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create print order
printingRouter.post('/orders', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const validated = PrintOrderSchema.parse(req.body);

    const costBreakdown = calculatePrintCost({
      pages: validated.pages,
      copies: validated.copies,
      colorMode: validated.colorMode,
      printSides: validated.printSides,
      bindingType: validated.bindingType,
      urgency: validated.urgency
    });

    const orderId = `ORD_PRINT_${Math.floor(1000 + Math.random() * 9000)}`;
    const estimatedDelivery = validated.urgency === 'express_morning_9am' ? 'Tomorrow, 8:45 AM (Hostel Gate)' : 'Tomorrow, 1:00 PM (Campus Canteen)';

    db.prepare(`
      INSERT INTO print_orders (
        id, user_id, document_title, file_path, pages, copies, color_mode,
        print_sides, binding_type, hostel_delivery_address, phone_number,
        urgency, total_amount, payment_status, order_status, estimated_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      userId,
      validated.documentTitle,
      req.body.filePath || 'document_print.pdf',
      validated.pages,
      validated.copies,
      validated.colorMode,
      validated.printSides,
      validated.bindingType,
      validated.hostelDeliveryAddress,
      validated.phoneNumber,
      validated.urgency,
      costBreakdown.totalAmount,
      'paid', // Simulating successful UPI payment
      'order_placed',
      estimatedDelivery
    );

    // Award bonus XP and coins
    db.prepare(`UPDATE profiles SET xp = xp + 40, campus_coins = campus_coins + 10 WHERE user_id = ?`).run(userId);

    const order = db.prepare('SELECT * FROM print_orders WHERE id = ?').get(orderId);
    res.status(201).json({
      order,
      breakdown: costBreakdown,
      message: `Order #${orderId} confirmed! Our campus delivery runner will deliver to your hostel before 9 AM tomorrow.`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update status (Admin / runner action)
printingRouter.patch('/orders/:id/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['order_placed', 'printing', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.prepare('UPDATE print_orders SET order_status = ? WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM print_orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated, message: `Order status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
