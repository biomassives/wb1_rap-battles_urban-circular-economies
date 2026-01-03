// api/check-drop.js

export default async function handler(req, res) {
  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: "WALLET_NOT_CONNECTED" });
  }

  // Worldbridger One: Intersectional Logic
  // We schedule drops based on the "Lattice Rhythm"
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  /**
   * SCHEDULE LOGIC: 
   * In WB1, the "Intersection" happens when the hour 
   * is an even number (Ska rhythm) and the minute 
   * matches a prime number (E8 resonance).
   */
  const isEvenHour = currentHour % 2 === 0;
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  const isLatticeAligned = primes.includes(currentMinute);

  // Mock checking your Postgres DB for the user's "Trust Level"
  // In production, you'd do: const user = await db.query('SELECT rank FROM users WHERE wallet = $1', [wallet]);
  const mockTrustLevel = 1; 

  const is_ready = isEvenHour && isLatticeAligned && mockTrustLevel >= 1;

  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow local phone nodes to call
  res.status(200).json({
    status: "WB1_ORACLE_SUCCESS",
    timestamp: now.toISOString(),
    lattice_coordinates: [currentHour, currentMinute],
    is_ready: is_ready,
    next_window: is_ready ? "NOW" : "T-MINUS_VAR_MINUTES",
    payload_metadata: {
      type: "BIODIVERSITY_REWARD",
      rarity: isEvenHour ? "COMMON" : "LEGENDARY_SURFACE",
      dimensions_verified: 8
    }
  });
}
