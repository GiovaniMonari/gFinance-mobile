// Fixed Railway host — infrastructure, not branding. Renaming this breaks
// every Open Finance call.
const API_URL =
  'https://gfinance-production-d5a6.up.railway.app';

export async function createConnectToken(token: string) {
  const response = await fetch(
    `${API_URL}/open-finance/connect-token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao gerar Connect Token: ${response.status}`,
    );
  }

  return response.json();
}

export async function connectBank(
  accessToken: string,
  itemId: string,
) {
  const response = await fetch(
    `${API_URL}/open-finance/connect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemId,
      }),
    },
  )

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null)

    throw new Error(
      data?.message ||
        `Erro ao conectar banco: ${response.status}`,
    )
  }

  return response.json()
}

export type DisconnectResult = {
  /**
   * `already_disconnected` means the backend found the record already
   * revoked — the end state is reached, so the caller should show it as a
   * settled fact rather than as an error.
   */
  status: 'disconnected' | 'already_disconnected';
  connection: { id: string; status: string } | null;
};

/**
 * Sever the link with the bank.
 *
 * The revocation happens upstream at Pluggy before our own record moves, so a
 * rejected call is a real failure and must not be reported as success.
 *
 * 409 is the one non-2xx that is not a failure: it answers a connection that
 * was already disconnected, which is what the user is asking for anyway.
 */
export async function disconnectConnection(
  accessToken: string,
  connectionId: string,
): Promise<DisconnectResult> {
  const response = await fetch(
    `${API_URL}/open-finance/connections/${connectionId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 409) {
    return {
      status: 'already_disconnected',
      connection: null,
    };
  }

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.message ||
        `Erro ao desconectar banco: ${response.status}`,
    );
  }

  // Read as text first: an empty body means the same settled state, and
  // `response.json()` would throw on it and report a success as a failure.
  const body = await response.text();

  return body.trim()
    ? JSON.parse(body)
    : { status: 'disconnected', connection: null };
}

/**
 * Whether this account may start an Open Finance connection right now.
 *
 * The answer is decided on the server — the release switch and the addresses
 * that are exempt live there — so no screen ever learns an address or holds a
 * copy of the rule. The app only has to render what it says.
 *
 * A failed read is reported as `true`: being unable to reach the backend is
 * an error state the caller already knows how to show, not a verdict about
 * the feature.
 */
export async function getOpenFinanceStatus(
  accessToken: string,
): Promise<{ available: boolean }> {
  const response = await fetch(
    `${API_URL}/open-finance/status`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao verificar o Open Finance: ${response.status}`,
    );
  }

  return response.json();
}

export async function getConnections(
  accessToken: string,
) {
  const response = await fetch(
    `${API_URL}/open-finance/connections`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar conexões: ${response.status}`,
    );
  }

  return response.json();
}

export async function getAccounts(
  accessToken: string,
  connectionId: string,
) {
  const response = await fetch(
    `${API_URL}/open-finance/connections/${connectionId}/accounts`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar contas: ${response.status}`,
    );
  }

  return response.json();
}

export async function getTransactions(
  accessToken: string,
  connectionId: string,
  accountId: string,
) {
  const response = await fetch(
    `${API_URL}/open-finance/connections/${connectionId}/accounts/${accountId}/transactions`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar transações: ${response.status}`,
    )
  }

  return response.json()
}