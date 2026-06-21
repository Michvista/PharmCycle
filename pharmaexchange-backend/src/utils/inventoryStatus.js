/**
 * Computes an InventoryItem's status based on expiry date and quantity.
 * This is the single source of truth used by:
 *  - dashboard donut chart (Inventory Status Overview)
 *  - alerts generation (near-expiry, low-stock)
 *  - the "Available Medicines for Transfer" eligibility logic
 *
 * Thresholds are intentionally simple/explainable for a hackathon demo.
 */

const NEAR_EXPIRY_DAYS = 30;
const LOW_STOCK_THRESHOLD = 50; // boxes/units - tune for your seed data

function computeStatus({ quantity, expiryDate }) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (daysToExpiry <= 0) return 'EXPIRED';
  if (daysToExpiry <= NEAR_EXPIRY_DAYS) return 'NEAR_EXPIRY';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK';
  return 'HEALTHY';
}

module.exports = { computeStatus, NEAR_EXPIRY_DAYS, LOW_STOCK_THRESHOLD };
