/**
 * /api/oracle/consent
 * Manage E8 Oracle Consent Settings
 *
 * Educational consent management with fun visuals
 */

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      error: 'Wallet address required',
      tip: '💡 Add ?walletAddress=your_wallet to the URL'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get consent settings from localStorage/database
  const consentSettings = await getConsentSettings(walletAddress);

  return new Response(JSON.stringify({
    success: true,
    walletAddress: walletAddress,
    consent: consentSettings,
    oracleStatus: {
      enabled: consentSettings.oracleEnabled,
      operationalMode: consentSettings.oracleEnabled ? 'ACTIVE' : 'STANDBY',
      colorBand: consentSettings.oracleEnabled ? 'neon-green-pulse' : 'gray-static',
      animation: consentSettings.oracleEnabled ? 'bubble-active' : 'bubble-dormant'
    },
    educational: {
      what: "Consent settings control who can query your oracle",
      why: "Your data sovereignty - you decide what to share",
      impact: consentSettings.oracleEnabled
        ? "🟢 Oracle is LIVE - responding to queries"
        : "⚪ Oracle is OFF - maximum privacy mode"
    },
    timestamp: Date.now()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, action, permission, value } = body;

    if (!walletAddress || !action) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['walletAddress', 'action']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;
    switch (action) {
      case 'ENABLE_ORACLE':
        result = await enableOracle(walletAddress);
        break;

      case 'DISABLE_ORACLE':
        result = await disableOracle(walletAddress);
        break;

      case 'GRANT_PERMISSION':
        result = await grantPermission(walletAddress, permission);
        break;

      case 'REVOKE_PERMISSION':
        result = await revokePermission(walletAddress, permission);
        break;

      case 'UPDATE_SETTING':
        result = await updateSetting(walletAddress, permission, value);
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Unknown action',
          availableActions: [
            'ENABLE_ORACLE',
            'DISABLE_ORACLE',
            'GRANT_PERMISSION',
            'REVOKE_PERMISSION',
            'UPDATE_SETTING'
          ]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Consent management error:', error);
    return new Response(JSON.stringify({
      error: 'Consent update failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions
async function getConsentSettings(walletAddress) {
  // Simulated consent settings
  return {
    oracleEnabled: true,
    permissions: {
      readXP: true,
      readMusic: true,
      readEnvironmental: false,
      readKakuma: true,
      writeOracle: false,
      zkProve: true,
      aggregate: false,
      transferCustody: false
    },
    visualSettings: {
      showOracleBand: true,
      bandColor: 'neon-green',
      animationType: 'pulse-bubble',
      notificationSound: true
    }
  };
}

async function enableOracle(walletAddress) {
  return {
    success: true,
    action: 'ENABLE_ORACLE',
    walletAddress: walletAddress,
    status: 'ACTIVE',
    message: '🟢 Oracle is now LIVE!',
    visual: {
      colorBand: 'neon-green-pulse',
      animation: 'bubble-active',
      theme: 'space-invaders-ska'
    },
    funFact: '🚀 Your data oracle is broadcasting! Privacy-preserving queries enabled.',
    timestamp: Date.now()
  };
}

async function disableOracle(walletAddress) {
  return {
    success: true,
    action: 'DISABLE_ORACLE',
    walletAddress: walletAddress,
    status: 'STANDBY',
    message: '⚪ Oracle is now in privacy mode',
    visual: {
      colorBand: 'gray-static',
      animation: 'bubble-dormant',
      theme: 'minimal'
    },
    funFact: '🔒 Maximum privacy mode - no queries will be answered.',
    timestamp: Date.now()
  };
}

async function grantPermission(walletAddress, permission) {
  return {
    success: true,
    action: 'GRANT_PERMISSION',
    permission: permission,
    message: `✅ Permission granted: ${permission}`,
    funFact: `You've enabled ${permission} for oracle queries!`,
    timestamp: Date.now()
  };
}

async function revokePermission(walletAddress, permission) {
  return {
    success: true,
    action: 'REVOKE_PERMISSION',
    permission: permission,
    message: `❌ Permission revoked: ${permission}`,
    funFact: `${permission} is now private - no queries allowed.`,
    timestamp: Date.now()
  };
}

async function updateSetting(walletAddress, setting, value) {
  return {
    success: true,
    action: 'UPDATE_SETTING',
    setting: setting,
    value: value,
    message: `⚙️ Setting updated: ${setting}`,
    timestamp: Date.now()
  };
}
