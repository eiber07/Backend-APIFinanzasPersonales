export const TRANSACTION_TYPE_INCOME = "ingreso";
export const TRANSACTION_TYPE_EXPENSE = "egreso";
export const TRANSACTION_TYPE_PLANNED_EXPENSE = "gasto planificado";

export function getCategoryTransactionType(transactionType) {
  const normalizedType = transactionType?.trim().toLocaleLowerCase();
  if (normalizedType === TRANSACTION_TYPE_INCOME) {
    return TRANSACTION_TYPE_INCOME;
  }
  if (
    normalizedType === TRANSACTION_TYPE_EXPENSE ||
    normalizedType === TRANSACTION_TYPE_PLANNED_EXPENSE
  ) {
    return TRANSACTION_TYPE_EXPENSE;
  }
  return null;
}
