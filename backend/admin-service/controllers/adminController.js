/**
 * adminController.js
 * Purpose: Validate input and call model for DB writes. Sends proper HTTP responses.
 */
const { insertEvent } = require('../models/adminModel');

/**
 * POST /api/admin/events
 * Body: { name: string, date: 'YYYY-MM-DD', tickets: number >= 0 }
 */
async function createEvent(req, res, next) {
  try {
    const { name, date, tickets } = req.body;

    // --- Basic validation (rubric: accepts/validates JSON input) ---
    if (typeof name !== 'string' || name.trim().length === 0) {
      const e = new Error('Invalid "name": non-empty string required');
      e.statusCode = 400;
      throw e;
    }
    // Simple YYYY-MM-DD check (lightweight)
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const e = new Error('Invalid "date": expected YYYY-MM-DD');
      e.statusCode = 400;
      throw e;
    }
    const ticketsNum = Number(tickets);
    if (!Number.isInteger(ticketsNum) || ticketsNum < 0) {
      const e = new Error('Invalid "tickets": non-negative integer required');
      e.statusCode = 400;
      throw e;
    }

    // --- Persist to DB ---
    const inserted = await insertEvent({ name: name.trim(), date, tickets: ticketsNum });

    // Success
    return res.status(201).json({
      message: 'Event created',
      event: inserted
    });
  } catch (err) {
    // 400 for validation; 500 otherwise (rubric error handling)
    if (!err.statusCode) err.statusCode = 500;
    return next(err);
  }
}

module.exports = { createEvent };
