"use client";

import { useCallback, useEffect, useState } from "react";
import { getGroupSettlement } from "@/lib/endpoints/transactions";
import { getUserById } from "@/lib/endpoints/users";

function formatTransactionMoney(amount) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function useGroupDebts(accountId, month, year) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDebts = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await getGroupSettlement(accountId, month, year);
      if (!res.ok) {
        setError("No se pudieron cargar las deudas.");
        setDebts([]);
        return;
      }

      const data = await res.json();

      if (!data.debts || data.debts.length === 0) {
        setDebts([]);
        return;
      }

      const userIds = [
        ...new Set([
          ...data.debts.map((d) => d.from_user_id),
          ...data.debts.map((d) => d.to_user_id),
        ]),
      ];

      const userMap = {};
      await Promise.all(
        userIds.map(async (id) => {
          try {
            const r = await getUserById(id);
            if (r.ok) {
              const u = await r.json();
              userMap[id] = `${u.name} ${u.last_name}`;
            } else {
              userMap[id] = `Usuario ${id}`;
            }
          } catch {
            userMap[id] = `Usuario ${id}`;
          }
        })
      );

      const mapped = data.debts.map((debt) => ({
        fromName: userMap[debt.from_user_id],
        toName: userMap[debt.to_user_id],
        amount: formatTransactionMoney(parseFloat(debt.amount)),
      }));

      setDebts(mapped);
    } catch (err) {
      console.error("Error cargando deudas:", err);
      setError("Error al conectar con el servidor.");
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, month, year]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  return { debts, loading, error, refetch: fetchDebts };
}