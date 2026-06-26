from fastapi import HTTPException
from fastapi.responses import JSONResponse

from app.dals.transaction_dal import TransactionDAL
from app.dals.status_dal import StatusDAL
from app.dals.account_dal import AccountDAL
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionRequest, TransactionResponse
from datetime import datetime
from app.dals.planned_expense_dal import PlannedExpenseDAL


class TransactionService:
    def __init__(
        self,
        transactionDAL: TransactionDAL,
        statusDAL: StatusDAL,
        accountDAL: AccountDAL,
    ):
        self.transactionDAL = transactionDAL
        self.statusDAL = statusDAL
        self.accountDAL = accountDAL

    async def _build_transaction_response(self, transaction: Transaction) -> TransactionResponse:
        return TransactionResponse(
            id=transaction.id,
            account_id=transaction.account_id,
            type=transaction.type.name,
            amount=transaction.amount,
            description=transaction.description,
            category=transaction.category.name if transaction.category else None,
            category_id=transaction.category_id,
            planned_expense_id=transaction.planned_expense_id,
            planned_expense_installment_number=transaction.planned_expense_installment_number,
            transaction_date=transaction.transaction_date,
        )

    async def _validate_account_access(self, account_id: int, current_user: User):
        account = await self.accountDAL.get_account_by_id(account_id)

        if account is None:
            raise HTTPException(status_code=404, detail="La cuenta no existe.",)

        if account.id_admin_user == current_user.id:
            return account
        # Si es cuenta grupal, verificar si es miembro
        if account.account_type_id == 2:
            from app.dals.group_account_member_dal import GroupAccountMemberDAL
            group_dal = GroupAccountMemberDAL(self.transactionDAL.db)
            members = await group_dal.get_by_account_id(account_id)
            member_ids = [m.user_id for m in members]
            if current_user.id in member_ids:
                return account
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta cuenta.")

    async def get_by_account_id(self, account_id: int, current_user: User):
        await self._validate_account_access(account_id, current_user)

        transactions = await self.transactionDAL.get_transactions_by_account_id(account_id)

        return [
            await self._build_transaction_response(t)
            for t in transactions
        ]

    async def get_by_id(self, transaction_id: int, current_user: User):
        transaction = await self.transactionDAL.get_transaction_by_id(transaction_id)

        if transaction is None:
            raise HTTPException(
                status_code=404,
                detail="La transacción no existe.",
            )

        await self._validate_account_access(transaction.account_id, current_user)

        return await self._build_transaction_response(transaction)

    async def create_transaction(self, transaction: TransactionCreate, current_user: User):
        await self._validate_account_access(transaction.account_id, current_user)

        active_status = await self.statusDAL.get_by_name('activa')

        new_transaction = Transaction(
            account_id=transaction.account_id,
            type_id=transaction.type_id,
            amount=transaction.amount,
            description=transaction.description,
            category_id=transaction.category_id,
            planned_expense_id=transaction.planned_expense_id,
            planned_expense_installment_number=transaction.planned_expense_installment_number,
            status_id=active_status.id,
            transaction_date=transaction.transaction_date.replace(tzinfo=None),
        )

        created = await self.transactionDAL.create_transaction(new_transaction)
        # si es pago de cuota, actualizar planned_expense
        if transaction.planned_expense_id and transaction.planned_expense_installment_number and transaction.type_id == 3:
            planned_expense_dal = PlannedExpenseDAL(self.transactionDAL.db)
            installment = await planned_expense_dal.get_by_group_and_installment(
                transaction.planned_expense_id,
                transaction.planned_expense_installment_number
            )
            if installment is None:
                raise HTTPException(status_code=404, detail="La cuota no existe.")
            
            if installment.status_id == 2:
                raise HTTPException(status_code=400, detail="Esta cuota ya fue pagada.")
            
            if transaction.planned_expense_installment_number > 1:
                previous_installment = await planned_expense_dal.get_by_group_and_installment(
                    transaction.planned_expense_id,
                    transaction.planned_expense_installment_number - 1
                )

            if previous_installment and previous_installment.status_id == 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Debes pagar la cuota {transaction.planned_expense_installment_number - 1} antes."
                )
            
            await planned_expense_dal.mark_installment_as_paid(
                transaction.planned_expense_id,
                transaction.planned_expense_installment_number
            )

        created = await self.transactionDAL.get_transaction_by_id(created.id)
        return await self._build_transaction_response(created)

    async def update_transaction(self, transaction: TransactionRequest, current_user: User):
        existing = await self.transactionDAL.get_transaction_by_id(transaction.id)

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="La transacción no existe.",
            )

        await self._validate_account_access(existing.account_id, current_user)

        existing.amount = transaction.amount if transaction.amount is not None else existing.amount
        existing.description = transaction.description if transaction.description is not None else existing.description
        existing.category_id = transaction.category_id if transaction.category_id is not None else existing.category_id
        existing.type_id = transaction.type_id if transaction.type_id is not None else existing.type_id
        existing.transaction_date = transaction.transaction_date.replace(tzinfo=None) if transaction.transaction_date is not None else existing.transaction_date

        updated = await self.transactionDAL.update_transaction(existing)
        updated = await self.transactionDAL.get_transaction_by_id(updated.id)

        return await self._build_transaction_response(updated)

    async def deactivate_transaction(self, transaction_id: int, current_user: User):
        transaction = await self.transactionDAL.get_transaction_by_id(transaction_id)

        if transaction is None:
            raise HTTPException(status_code=404, detail="La transacción no existe.")

        await self._validate_account_access(transaction.account_id, current_user)

        # Si era pago de cuota, revertir el pago
        if transaction.planned_expense_id and transaction.planned_expense_installment_number and transaction.type_id == 3:
            planned_expense_dal = PlannedExpenseDAL(self.transactionDAL.db)
            installment = await planned_expense_dal.get_by_group_and_installment(
                transaction.planned_expense_id,
                transaction.planned_expense_installment_number
            )
            if installment and installment.status_id == 2:
                installment.status_id = 1
                await self.transactionDAL.db.commit()

        await self.transactionDAL.deactivate_transaction(transaction)

        return JSONResponse(
            status_code=200,
            content={"message": "Transacción eliminada exitosamente", "success": True}
        )