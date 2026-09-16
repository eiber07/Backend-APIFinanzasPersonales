"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

const mockUser = {
  name: "Juan",
  last_name: "Pérez",
  email: "juan.perez@example.com",
};

const mockAccounts = [
  { id: 1, name: "Cuenta Personal", account_type: "personal" },
  { id: 2, name: "Viaje a Japón", account_type: "grupal" },
  { id: 3, name: "Gastos del depto", account_type: "grupal" },
];

export default function SidebarTestPage() {
  const [activeAccountId, setActiveAccountId] = useState(mockAccounts[0].id);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        user={mockUser}
        accounts={mockAccounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(account) => {
          console.log("Cuenta seleccionada:", account);
          setActiveAccountId(account.id);
        }}
        onAccountCreated={() => {
          console.log("Se creó una cuenta nueva (acá el dashboard real refetchea)");
        }}
      />

      <div style={{ padding: 24 }}>
        <p>Esto simula el resto del dashboard.</p>
        <p>Cuenta activa: <strong>{activeAccountId}</strong></p>
      </div>
    </div>
  );
}