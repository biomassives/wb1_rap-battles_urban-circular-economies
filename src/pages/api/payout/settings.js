// /api/payout/settings.js
// Manage user payout preferences

import { neon } from '@neondatabase/serverless';

// GET - Get user's payout settings
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get payout settings
    const settings = await sql`
      SELECT * FROM user_payout_settings
      WHERE wallet_address = ${walletAddress}
    `;

    // Get balance
    const balance = await sql`
      SELECT * FROM user_balances
      WHERE wallet_address = ${walletAddress}
    `;

    // Get payout limits based on KYC level
    const kycLevel = settings.length > 0 ? settings[0].kyc_level || 0 : 0;
    const limits = await sql`
      SELECT * FROM payout_limits
      WHERE kyc_level = ${kycLevel}
    `;

    // Get recent payouts
    const recentPayouts = await sql`
      SELECT
        id,
        payout_type,
        source_amount,
        source_currency,
        net_amount,
        target_currency,
        status,
        created_at,
        completed_at
      FROM payouts
      WHERE wallet_address = ${walletAddress}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Get today's payout total
    const todayPayouts = await sql`
      SELECT COALESCE(SUM(net_amount), 0) as total
      FROM payouts
      WHERE wallet_address = ${walletAddress}
        AND created_at > CURRENT_DATE
        AND status NOT IN ('failed', 'cancelled')
    `;

    const hasSettings = settings.length > 0;
    const userSettings = hasSettings ? settings[0] : null;
    const userBalance = balance.length > 0 ? balance[0] : {
      xp_balance: 0,
      usd_balance: 0,
      sol_balance: 0,
      pending_royalties: 0
    };

    return new Response(JSON.stringify({
      success: true,
      hasSettings,
      settings: userSettings,
      balance: userBalance,
      limits: limits[0] || {
        daily_limit_usd: 50,
        monthly_limit_usd: 200,
        single_transaction_limit_usd: 25,
        allowed_methods: ['gift_card']
      },
      usage: {
        todayTotal: parseFloat(todayPayouts[0]?.total || 0),
        remainingToday: (limits[0]?.daily_limit_usd || 50) - parseFloat(todayPayouts[0]?.total || 0)
      },
      recentPayouts,
      kycStatus: {
        level: kycLevel,
        levelName: limits[0]?.kyc_level_name || 'None',
        nextLevel: kycLevel < 3 ? kycLevel + 1 : null,
        requirements: limits[0]?.requirements || ['wallet_connected']
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching payout settings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch payout settings'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST - Update payout settings
export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      preferredMethod,
      // Mobile Money
      mobileMoneyProvider,
      mobileMoneyPhone,
      mobileMoneyName,
      mobileMoneyCountry,
      // Crypto
      cryptoWalletAddress,
      cryptoNetwork,
      cryptoToken,
      // Auto payout
      autoPayoutEnabled,
      autoPayoutThreshold,
      autoPayoutMethod,
      // Notifications
      payoutNotificationEmail,
      payoutNotificationSms
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validMethods = ['mobile_money', 'crypto', 'gift_card', 'bank_transfer'];
    if (preferredMethod && !validMethods.includes(preferredMethod)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid preferred method. Must be one of: ${validMethods.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate mobile money if selected
    if (preferredMethod === 'mobile_money') {
      if (!mobileMoneyPhone) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Mobile money phone number is required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const validProviders = ['mpesa', 'airtel_money', 'mtn_momo', 'chipper_cash', 'flutterwave'];
      if (mobileMoneyProvider && !validProviders.includes(mobileMoneyProvider)) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid mobile money provider. Must be one of: ${validProviders.join(', ')}`
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Validate crypto if selected
    if (preferredMethod === 'crypto') {
      if (!cryptoWalletAddress) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Crypto wallet address is required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Upsert settings
    await sql`
      INSERT INTO user_payout_settings (
        wallet_address,
        preferred_method,
        mobile_money_provider,
        mobile_money_phone,
        mobile_money_name,
        mobile_money_country,
        crypto_wallet_address,
        crypto_network,
        crypto_token,
        auto_payout_enabled,
        auto_payout_threshold,
        auto_payout_method,
        payout_notification_email,
        payout_notification_sms,
        updated_at
      ) VALUES (
        ${walletAddress},
        ${preferredMethod || 'gift_card'},
        ${mobileMoneyProvider || null},
        ${mobileMoneyPhone || null},
        ${mobileMoneyName || null},
        ${mobileMoneyCountry || null},
        ${cryptoWalletAddress || walletAddress},
        ${cryptoNetwork || 'solana'},
        ${cryptoToken || 'SOL'},
        ${autoPayoutEnabled || false},
        ${autoPayoutThreshold || 100},
        ${autoPayoutMethod || null},
        ${payoutNotificationEmail || null},
        ${payoutNotificationSms !== false},
        NOW()
      )
      ON CONFLICT (wallet_address) DO UPDATE SET
        preferred_method = COALESCE(${preferredMethod}, user_payout_settings.preferred_method),
        mobile_money_provider = COALESCE(${mobileMoneyProvider}, user_payout_settings.mobile_money_provider),
        mobile_money_phone = COALESCE(${mobileMoneyPhone}, user_payout_settings.mobile_money_phone),
        mobile_money_name = COALESCE(${mobileMoneyName}, user_payout_settings.mobile_money_name),
        mobile_money_country = COALESCE(${mobileMoneyCountry}, user_payout_settings.mobile_money_country),
        crypto_wallet_address = COALESCE(${cryptoWalletAddress}, user_payout_settings.crypto_wallet_address),
        crypto_network = COALESCE(${cryptoNetwork}, user_payout_settings.crypto_network),
        crypto_token = COALESCE(${cryptoToken}, user_payout_settings.crypto_token),
        auto_payout_enabled = COALESCE(${autoPayoutEnabled}, user_payout_settings.auto_payout_enabled),
        auto_payout_threshold = COALESCE(${autoPayoutThreshold}, user_payout_settings.auto_payout_threshold),
        auto_payout_method = COALESCE(${autoPayoutMethod}, user_payout_settings.auto_payout_method),
        payout_notification_email = COALESCE(${payoutNotificationEmail}, user_payout_settings.payout_notification_email),
        payout_notification_sms = COALESCE(${payoutNotificationSms}, user_payout_settings.payout_notification_sms),
        updated_at = NOW()
    `;

    // Also ensure user has a balance record
    await sql`
      INSERT INTO user_balances (wallet_address)
      VALUES (${walletAddress})
      ON CONFLICT (wallet_address) DO NOTHING
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Payout settings updated successfully',
      preferredMethod: preferredMethod || 'gift_card'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating payout settings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update payout settings: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
