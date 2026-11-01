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

export function formatCurrencyInput(value) {
  const cleaned = String(value).replace(/[^\d.,]/g, "");
  if (!cleaned) return "";

  const commaIndex = cleaned.lastIndexOf(",");
  const dotIndex = cleaned.lastIndexOf(".");
  const separatorIndex = Math.max(commaIndex, dotIndex);
  const separator = separatorIndex >= 0 ? cleaned[separatorIndex] : "";
  const trailingDigits = cleaned.length - separatorIndex - 1;
  const hasDecimal =
    separatorIndex >= 0 &&
    (separator === "," || trailingDigits <= 2);

  let integer = hasDecimal
    ? cleaned.slice(0, separatorIndex).replace(/[.,]/g, "")
    : cleaned.replace(/[.,]/g, "");
  const decimal = hasDecimal
    ? cleaned.slice(separatorIndex + 1).replace(/[^\d]/g, "").slice(0, 2)
    : "";

  integer = integer.replace(/^0+(?=\d)/, "");
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `$ ${integer}${hasDecimal ? `,${decimal}` : ""}`;
}

export function parseTransactionAmount(value) {
  const clean = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  return Number(clean);
}

export function formatDate(dateValue) {
  const [year, month, day] = String(dateValue).split("T")[0].split("-");
  if (!year || !month || !day) return "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function formatTransactionMoney(amount) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const PLANNED_TYPE_NAME = "gasto planificado";