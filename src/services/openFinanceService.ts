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