// /api/payout/initiate.js
// Initiate a payout request

import { neon } from '@neondatabase/serverless';

const CONVERSION_RATES = {
  XP_TO_USD: 0.001, // 1000 XP = $1
  USD_TO_KES: 130,
  USD_TO_UGX: 3700,
  SOL_TO_USD: 250
};

const FEES = {
  mobile_money: 0.035, // 3.5%
  crypto: 0.005, // Network fee ~0.5%
  gift_card: 0,
  bank_transfer: 0.02 // 2%
};

const MINIMUMS = {
  mobile_money: 4, // $4 USD
  crypto: 25, // $25 USD (0.1 SOL)
  gift_card: 1, // $1 USD (1000 XP)
  bank_transfer: 50 // $50 USD
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      payoutType, // 'mobile_money', 'crypto', 'gift_card', 'bank_transfer'
      sourceBalanceType = 'xp_rewards', // 'xp_rewards', 'nft_sales', 'royalties', 'mixed'
      sourceAmount,
      sourceCurrency = 'XP', // 'XP', 'USD', 'SOL'
      targetCurrency // 'KES', 'USD', 'SOL', etc.
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validPayoutTypes = ['mobile_money', 'crypto', 'gift_card', 'bank_transfer'];
    if (!payoutType || !validPayoutTypes.includes(payoutType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Payout type is required. Must be one of: ${validPayoutTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!sourceAmount || sourceAmount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Source amount is required and must be positive'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get user settings and verify payout method is configured
    const settings = await sql`
      SELECT * FROM user_payout_settings
      WHERE wallet_address = ${walletAddress}
    `;

    if (settings.length === 0 && payoutType !== 'gift_card') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please configure payout settings first'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const userSettings = settings[0] || {};

    // Verify specific settings exist for chosen method
    if (payoutType === 'mobile_money' && !userSettings.mobile_money_phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Mobile money phone number not configured'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (payoutType === 'crypto' && !userSettings.crypto_wallet_address) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crypto wallet address not configured'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get user balance
    const balance = await sql`
      SELECT * FROM user_balances
      WHERE wallet_address = ${walletAddress}
    `;

    const userBalance = balance.length > 0 ? balance[0] : {
      xp_balance: 0,
      usd_balance: 0,
      sol_balance: 0
    };

    // Also check XP from user_profiles
    const profile = await sql`
      SELECT xp FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    const profileXP = profile.length > 0 ? (profile[0].xp || 0) : 0;
    const availableXP = (userBalance.xp_balance || 0) + profileXP;

    // Verify sufficient balance
    let availableBalance = 0;
    if (sourceCurrency === 'XP') {
      availableBalance = availableXP;
    } else if (sourceCurrency === 'USD') {
      availableBalance = userBalance.usd_balance || 0;
    } else if (sourceCurrency === 'SOL') {
      availableBalance = userBalance.sol_balance || 0;
    }

    if (sourceAmount > availableBalance) {
      return new Response(JSON.stringify({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance} ${sourceCurrency}`,
        availableBalance,
        requested: sourceAmount
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Convert to USD for limit checking
    let amountInUSD = sourceAmount;
    if (sourceCurrency === 'XP') {
      amountInUSD = sourceAmount * CONVERSION_RATES.XP_TO_USD;
    } else if (sourceCurrency === 'SOL') {
      amountInUSD = sourceAmount * CONVERSION_RATES.SOL_TO_USD;
    }

    // Check minimum
    if (amountInUSD < MINIMUMS[payoutType]) {
      return new Response(JSON.stringify({
        success: false,
        error: `Minimum payout for ${payoutType.replace('_', ' ')} is $${MINIMUMS[payoutType]} USD`,
        minimum: MINIMUMS[payoutType],
        requested: amountInUSD
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check KYC limits
    const kycLevel = userSettings.kyc_level || 0;
    const limits = await sql`
      SELECT * FROM payout_limits
      WHERE kyc_level = ${kycLevel}
    `;

    const userLimits = limits[0] || {
      daily_limit_usd: 50,
      single_transaction_limit_usd: 25
    };

    if (amountInUSD > userLimits.single_transaction_limit_usd) {
      return new Response(JSON.stringify({
        success: false,
        error: `Single transaction limit is $${userLimits.single_transaction_limit_usd} USD for your KYC level`,
        limit: userLimits.single_transaction_limit_usd,
        requested: amountInUSD,
        kycLevel
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check daily limit
    const todayPayouts = await sql`
      SELECT COALESCE(SUM(converted_amount), 0) as total
      FROM payouts
      WHERE wallet_address = ${walletAddress}
        AND created_at > CURRENT_DATE
        AND status NOT IN ('failed', 'cancelled', 'refunded')
    `;

    const todayTotal = parseFloat(todayPayouts[0]?.total || 0);
    if (todayTotal + amountInUSD > userLimits.daily_limit_usd) {
      return new Response(JSON.stringify({
        success: false,
        error: `Daily limit would be exceeded. Limit: $${userLimits.daily_limit_usd}, Used today: $${todayTotal.toFixed(2)}`,
        dailyLimit: userLimits.daily_limit_usd,
        usedToday: todayTotal,
        remaining: userLimits.daily_limit_usd - todayTotal
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate conversion
    let convertedAmount = amountInUSD;
    let exchangeRate = 1;
    const finalTargetCurrency = targetCurrency || (payoutType === 'mobile_money' ? 'KES' : 'USD');

    if (finalTargetCurrency === 'KES') {
      exchangeRate = CONVERSION_RATES.USD_TO_KES;
      convertedAmount = amountInUSD * exchangeRate;
    } else if (finalTargetCurrency === 'UGX') {
      exchangeRate = CONVERSION_RATES.USD_TO_UGX;
      convertedAmount = amountInUSD * exchangeRate;
    } else if (finalTargetCurrency === 'SOL') {
      exchangeRate = 1 / CONVERSION_RATES.SOL_TO_USD;
      convertedAmount = amountInUSD * exchangeRate;
    }

    // Calculate fees
    const feeRate = FEES[payoutType] || 0;
    const platformFee = amountInUSD * feeRate;
    const platformFeePct = feeRate * 100;
    const networkFee = payoutType === 'crypto' ? 0.000005 : 0; // SOL network fee
    const totalFees = platformFee + networkFee;
    const netAmount = convertedAmount - (totalFees * (finalTargetCurrency === 'KES' ? CONVERSION_RATES.USD_TO_KES : 1));

    // Determine provider
    let provider = 'internal';
    let destinationIdentifier = '';

    if (payoutType === 'mobile_money') {
      provider = userSettings.mobile_money_provider || 'mpesa';
      destinationIdentifier = userSettings.mobile_money_phone;
    } else if (payoutType === 'crypto') {
      provider = userSettings.crypto_network || 'solana';
      destinationIdentifier = userSettings.crypto_wallet_address;
    }

    // Create payout record
    const result = await sql`
      INSERT INTO payouts (
        wallet_address,
        payout_type,
        source_balance_type,
        source_amount,
        source_currency,
        converted_amount,
        target_currency,
        exchange_rate,
        platform_fee,
        platform_fee_pct,
        network_fee,
        total_fees,
        net_amount,
        provider,
        destination_identifier,
        status
      ) VALUES (
        ${walletAddress},
        ${payoutType},
        ${sourceBalanceType},
        ${sourceAmount},
        ${sourceCurrency},
        ${convertedAmount},
        ${finalTargetCurrency},
        ${exchangeRate},
        ${platformFee},
        ${platformFeePct},
        ${networkFee},
        ${totalFees},
        ${netAmount},
        ${provider},
        ${destinationIdentifier ? destinationIdentifier.slice(0, 4) + '***' + destinationIdentifier.slice(-4) : null},
        'pending'
      )
      RETURNING id, created_at
    `;

    const payout = result[0];

    // Deduct from balance
    if (sourceCurrency === 'XP') {
      // Deduct from profile XP first
      const xpToDeduct = Math.min(sourceAmount, profileXP);
      if (xpToDeduct > 0) {
        await sql`
          UPDATE user_profiles
          SET xp = xp - ${xpToDeduct},
              updated_at = NOW()
          WHERE wallet_address = ${walletAddress}
        `;
      }
      // If more needed, deduct from balance
      const remainingDeduct = sourceAmount - xpToDeduct;
      if (remainingDeduct > 0) {
        await sql`
          UPDATE user_balances
          SET xp_balance = xp_balance - ${remainingDeduct},
              updated_at = NOW()
          WHERE wallet_address = ${walletAddress}
        `;
      }
    } else if (sourceCurrency === 'USD') {
      await sql`
        UPDATE user_balances
        SET usd_balance = usd_balance - ${sourceAmount},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
    } else if (sourceCurrency === 'SOL') {
      await sql`
        UPDATE user_balances
        SET sol_balance = sol_balance - ${sourceAmount},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      payout: {
        id: payout.id,
        type: payoutType,
        sourceAmount,
        sourceCurrency,
        convertedAmount: convertedAmount.toFixed(2),
        targetCurrency: finalTargetCurrency,
        exchangeRate,
        fees: {
          platform: platformFee.toFixed(4),
          platformPct: platformFeePct,
          network: networkFee,
          total: totalFees.toFixed(4)
        },
        netAmount: netAmount.toFixed(2),
        destination: destinationIdentifier ? destinationIdentifier.slice(0, 4) + '***' + destinationIdentifier.slice(-4) : null,
        status: 'pending',
        created_at: payout.created_at
      },
      message: payoutType === 'mobile_money'
        ? `Payout of ${netAmount.toFixed(2)} ${finalTargetCurrency} initiated! Expected within 2-5 minutes.`
        : payoutType === 'crypto'
          ? `Payout of ${netAmount.toFixed(6)} ${finalTargetCurrency} initiated! Expected within 1-2 minutes.`
          : `Payout initiated! Processing...`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error initiating payout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to initiate payout: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get payout history
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const status = url.searchParams.get('status');
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

    const payouts = await sql`
      SELECT
        id,
        payout_type,
        source_amount,
        source_currency,
        converted_amount,
        target_currency,
        net_amount,
        total_fees,
        provider,
        destination_identifier,
        status,
        error_message,
        created_at,
        completed_at
      FROM payouts
      WHERE wallet_address = ${walletAddress}
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get totals
    const totals = await sql`
      SELECT
        COUNT(*) as total_payouts,
        SUM(CASE WHEN status = 'completed' THEN converted_amount ELSE 0 END) as total_paid_out,
        SUM(CASE WHEN status = 'completed' THEN total_fees ELSE 0 END) as total_fees_paid
      FROM payouts
      WHERE wallet_address = ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      payouts,
      totals: totals[0] || {},
      pagination: {
        limit,
        offset,
        count: payouts.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching payouts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch payouts'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
