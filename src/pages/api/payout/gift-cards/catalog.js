// /api/payout/gift-cards/catalog.js
// Browse available gift cards

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const country = url.searchParams.get('country') || 'KEN';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get gift cards
    let giftCards = await sql`
      SELECT
        id,
        provider,
        card_name,
        card_description,
        category,
        available_countries,
        denominations,
        image_url,
        terms_url,
        min_order,
        max_order,
        delivery_method,
        stock_available
      FROM gift_card_catalog
      WHERE is_active = TRUE
      ${category ? sql`AND category = ${category}` : sql``}
      ORDER BY category, card_name
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Filter by country availability
    giftCards = giftCards.filter(card => {
      const countries = card.available_countries || [];
      return countries.includes(country) || countries.includes('ALL');
    });

    // Get categories with counts
    const categories = await sql`
      SELECT
        category,
        COUNT(*) as count
      FROM gift_card_catalog
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY count DESC
    `;

    // Get XP conversion rate
    const conversionRate = await sql`
      SELECT rate FROM conversion_rates
      WHERE id = 'xp_to_usd' AND is_active = TRUE
    `;

    const xpToUsd = conversionRate.length > 0 ? parseFloat(conversionRate[0].rate) : 0.001;

    // Enhance gift cards with XP costs
    const enhancedCards = giftCards.map(card => {
      const denominations = card.denominations || [];
      const enhancedDenominations = denominations.map(d => ({
        ...d,
        cost_xp: d.cost_xp || Math.ceil(d.value / xpToUsd / (d.currency === 'KES' ? 130 : 1))
      }));

      return {
        ...card,
        denominations: enhancedDenominations,
        inStock: card.stock_available === null || card.stock_available > 0
      };
    });

    return new Response(JSON.stringify({
      success: true,
      giftCards: enhancedCards,
      categories,
      filters: {
        country,
        category: category || 'all'
      },
      conversionInfo: {
        xpToUsd,
        example: `${Math.ceil(1 / xpToUsd)} XP = $1 USD`
      },
      pagination: {
        limit,
        offset,
        count: enhancedCards.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching gift card catalog:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch gift card catalog'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
