const prisma = require('../lib/prisma');
const { callLLM } = require('../lib/llm');

/**
 * GET /insights
 * Returns the most recently cached insight of each type for this pharmacy.
 * Cheap and fast - no LLM call here, just reads AIInsight rows.
 */
async function getInsights(req, res) {
  const { pharmacyId } = req.user;

  const types = ['EXPIRY_RISK', 'DEMAND_FORECAST', 'RESTOCK_SUGGESTION'];

  const insights = await Promise.all(
    types.map((type) =>
      prisma.aIInsight.findFirst({
        where: { pharmacyId, type },
        orderBy: { generatedAt: 'desc' },
      })
    )
  );

  res.json({ insights: insights.filter(Boolean) });
}

/**
 * POST /insights/generate
 * Body: { type: 'EXPIRY_RISK' | 'DEMAND_FORECAST' | 'RESTOCK_SUGGESTION' }
 * Pulls real data for this pharmacy, sends it to the LLM, stores + returns the result.
 * This is the endpoint to hit LIVE during a demo for the "AI working in real time" moment.
 */
async function generateInsight(req, res) {
  const { pharmacyId } = req.user;
  const { type } = req.body;

  if (!['EXPIRY_RISK', 'DEMAND_FORECAST', 'RESTOCK_SUGGESTION'].includes(type)) {
    return res.status(400).json({ error: 'Invalid insight type' });
  }

  let payload;

  if (type === 'EXPIRY_RISK') {
    payload = await generateExpiryRiskInsight(pharmacyId);
  } else if (type === 'DEMAND_FORECAST') {
    payload = await generateDemandForecastInsight(pharmacyId);
  } else {
    payload = await generateRestockInsight(pharmacyId);
  }

  const insight = await prisma.aIInsight.create({
    data: { pharmacyId, type, payload },
  });

  res.status(201).json(insight);
}

// ──────────────────────────────────────────
// Insight generators - each pulls real DB data, prompts the LLM for
// structured JSON, and returns a clean payload to store/display.
// ──────────────────────────────────────────

async function generateExpiryRiskInsight(pharmacyId) {
  const nearExpiryItems = await prisma.inventoryItem.findMany({
    where: { pharmacyId, status: { in: ['NEAR_EXPIRY', 'LOW_STOCK'] } },
    include: { medicine: true },
    take: 15,
  });

  if (nearExpiryItems.length === 0) {
    return { riskItems: [], summary: 'No medicines are currently at elevated expiry risk.' };
  }

  const itemSummaries = nearExpiryItems.map((i) => ({
    id: i.id,
    medicine: `${i.medicine.name} ${i.medicine.strength}`,
    quantity: i.quantity,
    expiryDate: i.expiryDate.toISOString().split('T')[0],
    daysToExpiry: Math.ceil((new Date(i.expiryDate) - new Date()) / 86400000),
  }));

  const result = await callLLM({
    systemPrompt: `You are a pharmaceutical inventory risk analyst. Given a list of inventory items with quantity and days-to-expiry, return ONLY valid JSON in this exact shape:
{"riskItems": [{"id": "string", "medicine": "exact medicine name from input", "riskLevel": "high"|"medium"|"low", "reason": "short string", "suggestedAction": "short string", "suggestedDiscount": number}], "summary": "one sentence overall summary"}
Copy the medicine name exactly from the input for each id. suggestedDiscount is a percent (0-50). Be concise.`,
    userPrompt: JSON.stringify(itemSummaries),
  });

  const nameById = Object.fromEntries(itemSummaries.map((i) => [i.id, i.medicine]));
  result.riskItems = (result.riskItems || []).map((ri) => ({
    ...ri,
    medicine: ri.medicine || nameById[ri.id] || 'Unknown medicine',
  }));

  return result;
}

async function generateDemandForecastInsight(pharmacyId) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const sales = await prisma.salesRecord.groupBy({
    by: ['medicineId'],
    where: { pharmacyId, date: { gte: since } },
    _sum: { quantitySold: true },
  });

  if (sales.length === 0) {
    return { forecasts: [], summary: 'Not enough sales history yet to generate a demand forecast.' };
  }

  const medicineIds = sales.map((s) => s.medicineId);
  const medicines = await prisma.medicine.findMany({ where: { id: { in: medicineIds } } });

  const salesSummary = sales.map((s) => {
    const med = medicines.find((m) => m.id === s.medicineId);
    return { medicineId: s.medicineId, medicineName: med?.name, last90DaysSold: s._sum.quantitySold };
  });

  const result = await callLLM({
    systemPrompt: `You are a pharmaceutical demand forecasting analyst for the Nigerian market. Given 90-day sales totals per medicine, factor in general Nigerian seasonal disease patterns (e.g. malaria/typhoid surge in rainy season ~April-October, respiratory infections in dry/harmattan season ~Nov-Feb, cholera risk in flooding season). Return ONLY valid JSON:
{"forecasts": [{"medicineName": "string", "predictedChangePercent": number, "direction": "increase"|"decrease"|"stable", "reason": "short string"}], "summary": "one sentence summary"}
predictedChangePercent should be realistic (typically -40 to +50). Be concise.`,
    userPrompt: JSON.stringify(salesSummary),
  });

  return result;
}

async function generateRestockInsight(pharmacyId) {
  const items = await prisma.inventoryItem.findMany({
    where: { pharmacyId },
    include: { medicine: true },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const recentSales = await prisma.salesRecord.groupBy({
    by: ['medicineId'],
    where: { pharmacyId, date: { gte: since } },
    _sum: { quantitySold: true },
  });

  const stockSummary = items.map((i) => {
    const sales = recentSales.find((s) => s.medicineId === i.medicineId);
    return {
      medicineName: i.medicine.name,
      currentQuantity: i.quantity,
      last30DaysSold: sales?._sum.quantitySold || 0,
      status: i.status,
    };
  });

  const result = await callLLM({
    systemPrompt: `You are a pharmacy stock planning analyst. Given current stock levels and last-30-day sales velocity per medicine, recommend which medicines to restock and suggested reorder quantity. Return ONLY valid JSON:
{"recommendations": [{"medicineName": "string", "currentQuantity": number, "recommendedReorderQty": number, "urgency": "high"|"medium"|"low", "reason": "short string"}], "summary": "one sentence summary"}
Only include medicines that genuinely need restocking (low quantity relative to sales velocity). Be concise.`,
    userPrompt: JSON.stringify(stockSummary),
  });

  return result;
}

module.exports = { getInsights, generateInsight };
