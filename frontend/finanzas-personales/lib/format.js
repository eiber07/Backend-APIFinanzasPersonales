export function extractDigits(value) {
  return value.replace(/\D/g, "");
}

export function digitsToMoneyDisplay(digits) {
  if (!digits) return "";
  const numero = (parseInt(digits, 10) / 100).toFixed(2);
  let [entero, decimal] = numero.split(".");
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${entero},${decimal}`;
}

export function parseTransactionAmount(value) {
  const clean = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  return Number(clean);
}

export function formatTransactionMoney(amount) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}