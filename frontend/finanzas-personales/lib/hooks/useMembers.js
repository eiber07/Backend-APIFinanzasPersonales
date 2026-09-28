"use client";

import { useCallback, useEffect, useState } from "react";
import { getMembers } from "@/lib/endpoints/members";
import { getGroupSettlement } from "@/lib/endpoints/transactions";

export function useMembers(accountId, month, year) {
  const [members, setMembers] = useState([]);
  const [balancesByUserId, setBalancesByUserId] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);

    try {
      const res = await getMembers(accountId);
      if (!res.ok) throw new Error("No se pudieron cargar los miembros.");
      const data = await res.json();
      setMembers(data);

      try {
        const settlementRes = await getGroupSettlement(accountId, month, year);
        if (settlementRes.ok) {
          const settlement = await settlementRes.json();
          const map = new Map();
          (settlement.balances || []).forEach((item) => {
            map.set(Number(item.user_id), Number(item.balance));
          });
          setBalancesByUserId(map);
        } else {
          setBalancesByUserId(new Map());
        }
      } catch {
        setBalancesByUserId(new Map());
      }
    } catch (error) {
      console.error("Error cargando miembros:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, month, year]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, balancesByUserId, loading, refetch: fetchMembers };
}