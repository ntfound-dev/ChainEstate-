import fs from 'node:fs/promises';

const NOX_GATEWAY = 'https://2e1800fc0dddeeadc189283ed1dce13c1ae28d48-3000.apps.ovh-tdx-dev.noxprotocol.dev';

function uintToHex256(value) {
  return '0x' + BigInt(value).toString(16).padStart(64, '0');
}

const main = async () => {
  const { IEXEC_OUT } = process.env;
  let computedJsonObj = {};

  try {
    const args = process.argv.slice(2);
    if (args.length < 3) {
      throw new Error(`Expected 3 args: tokenAmount contractAddress buyerAddress, got ${args.length}`);
    }

    const [tokenAmount, contractRaw, buyerRaw] = args;
    // iExec CLI interprets 0x-prefixed hex as JS numbers — receive without 0x and re-add here
    const contractAddress = contractRaw.startsWith('0x') ? contractRaw : '0x' + contractRaw;
    const buyerAddress    = buyerRaw.startsWith('0x')    ? buyerRaw    : '0x' + buyerRaw;
    console.log(`Encrypting tokenAmount=${tokenAmount} for contract=${contractAddress} owner=${buyerAddress}`);

    const res = await fetch(`${NOX_GATEWAY}/v0/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: uintToHex256(tokenAmount),
        solidityType: 'uint256',
        applicationContract: contractAddress,
        owner: buyerAddress,
      }),
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Nox gateway error (${res.status}): ${text}`);
    }

    const raw = await res.json();
    if (!res.ok) {
      throw new Error(`Nox gateway error ${res.status}: ${JSON.stringify(raw)}`);
    }

    const payload = (typeof raw?.payload === 'object' && raw.payload !== null) ? raw.payload : raw;
    const handle = payload.handle;
    const handleProof = payload.proof;

    if (!handle || !handleProof) {
      throw new Error(`Incomplete Nox response: ${JSON.stringify(raw)}`);
    }

    console.log(`Encryption successful. handle=${handle}`);

    const result = { handle, handleProof, tokenAmount, contractAddress, buyerAddress };
    await fs.writeFile(`${IEXEC_OUT}/result.json`, JSON.stringify(result));
    computedJsonObj = { 'deterministic-output-path': `${IEXEC_OUT}/result.json` };

  } catch (e) {
    console.error('iApp error:', e.message ?? e);
    computedJsonObj = {
      'deterministic-output-path': IEXEC_OUT,
      'error-message': e.message ?? 'Computation failed',
    };
  } finally {
    await fs.writeFile(`${IEXEC_OUT}/computed.json`, JSON.stringify(computedJsonObj));
  }
};

main();
