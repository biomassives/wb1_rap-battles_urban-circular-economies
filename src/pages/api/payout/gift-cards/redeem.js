// /api/payout/gift-cards/redeem.js
// Redeem XP for a gift card

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      catalogId,
      denominationIndex, // Which denomination from the card's denominations array
      deliveryMethod = 'instant', // 'instant', 'email', 'sms'
      deliveryDestination, // Email or phone for delivery
      quantity = 1
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!catalogId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Catalog ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (denominationIndex === undefined || denominationIndex < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Denomination index is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (quantity < 1 || quantity > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quantity must be between 1 and 10'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validDeliveryMethods = ['instant', 'email', 'sms'];
    if (!validDeliveryMethods.includes(deliveryMethod)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Delivery method must be one of: ${validDeliveryMethods.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (['email', 'sms'].includes(deliveryMethod) && !deliveryDestination) {
      return new Response(JSON.stringify({
        success: false,
        error: `${deliveryMethod === 'email' ? 'Email' : 'Phone number'} is required for ${deliveryMethod} delivery`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get gift card details
    const catalog = await sql`
      SELECT * FROM gift_card_catalog
      WHERE id = ${catalogId}
        AND is_active = TRUE
    `;

    if (catalog.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Gift card not found or no longer available'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const card = catalog[0];
    const denominations = card.denominations || [];

    if (denominationIndex >= denominations.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid denomination selected'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const selectedDenom = denominations[denominationIndex];
    const totalXPCost = (selectedDenom.cost_xp || 0) * quantity;
    const totalValue = selectedDenom.value * quantity;

    // Check stock
    if (card.stock_available !== null && card.stock_available < quantity) {
      return new Response(JSON.stringify({
        success: false,
        error: `Insufficient stock. Available: ${card.stock_available}`,
        availableStock: card.stock_available
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check user's XP balance
    const profile = await sql`
      SELECT xp FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    if (profile.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User profile not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const userXP = profile[0].xp || 0;

    // Also check balance table
    const balance = await sql`
      SELECT xp_balance FROM user_balances
      WHERE wallet_address = ${walletAddress}
    `;

    const balanceXP = balance.length > 0 ? (balance[0].xp_balance || 0) : 0;
    const totalAvailableXP = userXP + balanceXP;

    if (totalAvailableXP < totalXPCost) {
      return new Response(JSON.stringify({
        success: false,
        error: `Insufficient XP. Required: ${totalXPCost}, Available: ${totalAvailableXP}`,
        required: totalXPCost,
        available: totalAvailableXP
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate redemption codes (in production, would integrate with gift card provider)
    const redemptions = [];

    for (let i = 0; i < quantity; i++) {
      // Generate mock redemption code
      const redemptionCode = `WB1-${catalogId.toUpperCase().slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const pinCode = Math.random().toString().slice(2, 8);

      const result = await sql`
        INSERT INTO gift_card_redemptions (
          wallet_address,
          catalog_id,
          denomination_value,
          denomination_currency,
          cost_xp,
          cost_usd,
          redemption_code,
          pin_code,
          delivery_method,
          delivery_destination,
          status
        ) VALUES (
          ${walletAddress},
          ${catalogId},
          ${selectedDenom.value},
          ${selectedDenom.currency},
          ${selectedDenom.cost_xp},
          ${selectedDenom.value / (selectedDenom.currency === 'KES' ? 130 : 1)},
          ${redemptionCode},
          ${pinCode},
          ${deliveryMethod},
          ${deliveryDestination || null},
          'delivered'
        )
        RETURNING id, redemption_code, pin_code, created_at
      `;

      redemptions.push({
        id: result[0].id,
        cardName: card.card_name,
        value: selectedDenom.value,
        currency: selectedDenom.currency,
        redemptionCode: result[0].redemption_code,
        pin: result[0].pin_code,
        created_at: result[0].created_at
      });
    }

    // Deduct XP
    const xpFromProfile = Math.min(totalXPCost, userXP);
    if (xpFromProfile > 0) {
      await sql`
        UPDATE user_profiles
        SET xp = xp - ${xpFromProfile},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
    }

    const xpFromBalance = totalXPCost - xpFromProfile;
    if (xpFromBalance > 0) {
      await sql`
        UPDATE user_balances
        SET xp_balance = xp_balance - ${xpFromBalance},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
    }

    // Update stock if applicable
    if (card.stock_available !== null) {
      await sql`
        UPDATE gift_card_catalog
        SET stock_available = stock_available - ${quantity},
            updated_at = NOW()
        WHERE id = ${catalogId}
      `;
    }

    // Log activity
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'gift_card_redemption',
        ${-totalXPCost},
        ${`Redeemed ${quantity}x ${card.card_name} (${selectedDenom.value} ${selectedDenom.currency})`},
        ${JSON.stringify({ catalog_id: catalogId, quantity, total_value: totalValue })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      redemptions,
      summary: {
        cardName: card.card_name,
        quantity,
        totalValue,
        currency: selectedDenom.currency,
        xpSpent: totalXPCost,
        deliveryMethod,
        deliveryDestination: deliveryDestination || 'instant'
      },
      message: deliveryMethod === 'instant'
        ? `${quantity}x ${card.card_name} redeemed! Your codes are below.`
        : `${quantity}x ${card.card_name} redeemed! Codes will be sent to ${deliveryDestination}.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to redeem gift card: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get user's redemption history
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    const redemptions = await sql`
      SELECT
        r.id,
        r.catalog_id,
        r.denomination_value,
        r.denomination_currency,
        r.cost_xp,
        r.redemption_code,
        r.pin_code,
        r.delivery_method,
        r.status,
        r.created_at,
        r.expires_at,
        c.card_name,
        c.provider,
        c.category
      FROM gift_card_redemptions r
      LEFT JOIN gift_card_catalog c ON r.catalog_id = c.id
      WHERE r.wallet_address = ${walletAddress}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get totals
    const totals = await sql`
      SELECT
        COUNT(*) as total_redemptions,
        SUM(cost_xp) as total_xp_spent,
        SUM(denomination_value) as total_value
      FROM gift_card_redemptions
      WHERE wallet_address = ${walletAddress}
        AND status IN ('delivered', 'used')
    `;

    return new Response(JSON.stringify({
      success: true,
      redemptions,
      totals: totals[0] || {},
      pagination: {
        limit,
        offset,
        count: redemptions.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch redemptions'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
