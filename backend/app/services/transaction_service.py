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
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.dals.transaction_category_dal import TransactionCategoryDAL
from app.dals.transaction_type_dal import TransactionTypeDAL
from app.models.account import Account
from app.models.transaction_category import TransactionCategory
from app.constants.transaction_types import (
    TRANSACTION_TYPE_EXPENSE,
    TRANSACTION_TYPE_INCOME,
    TRANSACTION_TYPE_PLANNED_EXPENSE,
)


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
        user_name = None
        
        if transaction.creator is not None:
            user_name = (
                f"{transaction.creator.name} "
                f"{transaction.creator.last_name}"
            ).strip()
            
        return TransactionResponse(
            id=transaction.id,
            account_id=transaction.account_id,
            user_id=transaction.user_id,
            user_name=user_name,
            type=transaction.type.name,
            amount=transaction.amount,
            description=transaction.description,
            category=transaction.category.name if transaction.category else None,
            category_id=transaction.category_id,
            category_parent_category_id=(
                transaction.category.parent_category_id
                if transaction.category
                else None
            ),
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

    async def _validate_category_access(
        self,
        category_id: int,
        account: Account,
        current_user: User,
    ) -> TransactionCategory:
        category = await TransactionCategoryDAL(
            self.transactionDAL.db
        ).get_by_id(category_id)
        if category is None:
            raise HTTPException(status_code=404, detail="La categoría no existe.")

        is_global = (
            category.owner_id is None
            and category.group_id is None
            and category.account_id is None
        )
        if is_global:
            return category

        if category.account_id is not None:
            if account.account_type_id != 1 or category.account_id != account.id:
                raise HTTPException(
                    status_code=403,
                    detail="La categoría no está disponible para esta cuenta.",
                )
            return category

        if category.group_id is not None:
            if account.account_type_id != 2 or category.group_id != account.id:
                raise HTTPException(
                    status_code=403,
                    detail="La categoría no está disponible para esta cuenta.",
                )
            return category

        if account.account_type_id == 2 or category.owner_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="La categoría no está disponible para esta cuenta.",
            )
        return category

    async def _validate_transaction_category(
        self,
        category_id: int,
        type_id: int,
        account: Account,
        current_user: User,
        planned_expense_id: int | None = None,
    ):
        transaction_type = await TransactionTypeDAL(
            self.transactionDAL.db
        ).get_by_id(type_id)
        if transaction_type is None:
            raise HTTPException(
                status_code=400,
                detail="El tipo de transacción no existe.",
            )

        type_name = transaction_type.name.strip().casefold()
        if type_name == TRANSACTION_TYPE_INCOME:
            expected_category_type = TRANSACTION_TYPE_INCOME
        elif type_name in {
            TRANSACTION_TYPE_EXPENSE,
            TRANSACTION_TYPE_PLANNED_EXPENSE,
        }:
            expected_category_type = TRANSACTION_TYPE_EXPENSE
        else:
            raise HTTPException(
                status_code=400,
                detail="El tipo de transacción no admite categorías.",
            )

        if (
            planned_expense_id is not None
            and expected_category_type != TRANSACTION_TYPE_EXPENSE
        ):
            raise HTTPException(
                status_code=400,
                detail="Un gasto planificado solo puede asociarse a una transacción de egreso.",
            )

        category = await self._validate_category_access(
            category_id,
            account,
            current_user,
        )
        if category.transaction_type != expected_category_type:
            raise HTTPException(
                status_code=400,
                detail="La categoría seleccionada no corresponde al tipo de transacción.",
            )
        return category

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
        account = await self._validate_account_access(transaction.account_id, current_user)
        await self._validate_transaction_category(
            transaction.category_id,
            transaction.type_id,
            account,
            current_user,
            transaction.planned_expense_id,
        )
        transaction_user_id = (
            transaction.user_id
            if transaction.user_id is not None
            else current_user.id
        )

        if account.account_type_id == 2:
            group_dal = GroupAccountMemberDAL(self.transactionDAL.db)
            members = await group_dal.get_by_account_id(account.id)
            member_ids = {member.user_id for member in members}
            member_ids.add(account.id_admin_user)
            if transaction_user_id not in member_ids:
                raise HTTPException(
                    status_code=400,
                    detail="El autor seleccionado no pertenece a esta cuenta grupal.",
                )
        elif transaction_user_id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Solo podés registrar transacciones a tu nombre en cuentas personales.",
            )

        active_status = await self.statusDAL.get_by_name('activa')

        new_transaction = Transaction(
            account_id=transaction.account_id,
            user_id=transaction_user_id,
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

        account = await self._validate_account_access(
            existing.account_id,
            current_user,
        )

        new_category_id = (
            transaction.category_id
            if transaction.category_id is not None
            else existing.category_id
        )
        new_type_id = (
            transaction.type_id
            if transaction.type_id is not None
            else existing.type_id
        )
        if transaction.category_id is not None or transaction.type_id is not None:
            await self._validate_transaction_category(
                new_category_id,
                new_type_id,
                account,
                current_user,
                existing.planned_expense_id,
            )

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

        if transaction.planned_expense_id and transaction.type_id == 3:
            raise HTTPException(
                status_code=400,
                detail="No podés eliminar una transacción asociada a un gasto planificado."
            )

        await self.transactionDAL.deactivate_transaction(transaction)

        return JSONResponse(
            status_code=200,
            content={"message": "Transacción eliminada exitosamente", "success": True}
        )