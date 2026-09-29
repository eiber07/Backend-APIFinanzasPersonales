"use client";

import { useCallback, useEffect, useState } from "react";
import { getParameters } from "@/lib/endpoints/parameters";

function formatParameterLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useParameters(type) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getParameters(type);
      if (!res.ok) return;
      const data = await res.json();
      setOptions(
        data.result.map((p) => ({
          id: p.id,
          value: p.value,
          label: formatParameterLabel(p.value),
        }))
      );
    } catch (error) {
      console.error("Error cargando parámetros:", error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  return { options, loading };
}