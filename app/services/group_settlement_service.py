from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException

from app.dals.account_dal import AccountDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.transaction_dal import TransactionDAL
from app.models.user import User


CENT = Decimal("0.01")


def calculate_group_balances_and_debts(transactions: list[Any], member_ids: list[int]) -> tuple[dict[int, Decimal], list[dict[str, Any]]]:
    if not member_ids:
        return {}, []

    normalized_member_ids = sorted(set(member_ids))
    balances = {member_id: Decimal("0") for member_id in normalized_member_ids}

    for transaction in transactions:
        transaction_type  = (
            getattr(getattr(transaction, "type", None), "name", "")
            .strip()
            .lower()
        )
        if transaction_type not in {"egreso", "gasto planificado"}:
            continue
        amount = Decimal(str(transaction.amount))
        payer_id = getattr(transaction, "user_id", None)

        if payer_id is None:
            raise HTTPException(status_code=400, detail="Cada transacción debe incluir el usuario que adelantó el dinero.")

        if payer_id not in balances:
            raise HTTPException(status_code=400, detail="El usuario de la transacción no pertenece a la cuenta grupal.")

        share = (amount / Decimal(len(normalized_member_ids))).quantize(CENT, rounding=ROUND_HALF_UP)

        for member_id in normalized_member_ids:
            if member_id == payer_id:
                balances[member_id] += amount - share
            else:
                balances[member_id] -= share

    total_balance = sum(balances.values(), Decimal("0"))
    if total_balance != 0:
        last_member_id = normalized_member_ids[-1]
        balances[last_member_id] -= total_balance

    for member_id in balances:
        balances[member_id] = balances[member_id].quantize(CENT, rounding=ROUND_HALF_UP)

    debts = []
    creditors = sorted(((member_id, balance) for member_id, balance in balances.items() if balance > 0), key=lambda item: item[1], reverse=True)
    debtors = sorted(((member_id, balance) for member_id, balance in balances.items() if balance < 0), key=lambda item: item[1])

    creditor_index = 0
    debtor_index = 0

    while creditor_index < len(creditors) and debtor_index < len(debtors):
        creditor_id, creditor_balance = creditors[creditor_index]
        debtor_id, debtor_balance = debtors[debtor_index]

        if creditor_balance <= 0 or debtor_balance >= 0:
            break

        amount = min(creditor_balance, abs(debtor_balance))
        amount = amount.quantize(CENT, rounding=ROUND_HALF_UP)

        if amount > 0:
            debts.append({
                "from_user_id": debtor_id,
                "to_user_id": creditor_id,
                "amount": amount,
            })

        creditors[creditor_index] = (creditor_id, creditor_balance - amount)
        debtors[debtor_index] = (debtor_id, debtor_balance + amount)

        if creditors[creditor_index][1] <= 0:
            creditor_index += 1
        if debtors[debtor_index][1] >= 0:
            debtor_index += 1

    return balances, debts


class GroupSettlementService:
    def __init__(self, transaction_dal: TransactionDAL, group_account_member_dal: GroupAccountMemberDAL, account_dal: AccountDAL):
        self.transaction_dal = transaction_dal
        self.group_account_member_dal = group_account_member_dal
        self.account_dal = account_dal

    async def _validate_access(self, account_id: int, current_user: User):
        account = await self.account_dal.get_account_by_id(account_id)

        if account is None:
            raise HTTPException(status_code=404, detail="La cuenta no existe.")

        if account.account_type_id != 2:
            raise HTTPException(status_code=400, detail="La liquidación solo aplica a cuentas grupales.")

        if account.id_admin_user == current_user.id:
            return account

        members = await self.group_account_member_dal.get_by_account_id(account_id)
        member_ids = {member.user_id for member in members}
        if current_user.id in member_ids:
            return account

        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta cuenta.")

    async def calculate_settlement(self, account_id: int, current_user: User, month: int | None = None, year: int | None = None):
        await self._validate_access(account_id, current_user)

        account = await self.account_dal.get_account_by_id(account_id)
        members = await self.group_account_member_dal.get_by_account_id(account_id)
        member_ids = sorted({account.id_admin_user, *(member.user_id for member in members)})

        transactions = await self.transaction_dal.get_transactions_by_account_id(account_id)

        if month is not None:
            if month < 1 or month > 12:
                raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12.")
            transactions = [transaction for transaction in transactions if transaction.transaction_date.month == month]

        if year is not None:
            transactions = [transaction for transaction in transactions if transaction.transaction_date.year == year]

        balances, debts = calculate_group_balances_and_debts(transactions, member_ids)

        return {
            "account_id": account_id,
            "month": month,
            "year": year,
            "balances": [
                {"user_id": user_id, "balance": balance}
                for user_id, balance in balances.items()
            ],
            "debts": debts,
        }
