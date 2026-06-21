from fastapi import HTTPException
from fastapi.responses import JSONResponse

from app.dals.planned_expense_dal import PlannedExpenseDAL
from app.dals.status_dal import StatusDAL
from app.dals.account_dal import AccountDAL
from app.models.planned_expense import PlannedExpense
from app.models.user import User
from app.schemas.planned_expense import PlannedExpenseCreate, PlannedExpenseRequest, PlannedExpenseResponse
from datetime import datetime


class PlannedExpenseService:
    def __init__(
        self,
        plannedExpenseDAL: PlannedExpenseDAL,
        statusDAL: StatusDAL,
        accountDAL: AccountDAL,
    ):
        self.plannedExpenseDAL = plannedExpenseDAL
        self.statusDAL = statusDAL
        self.accountDAL = accountDAL

    async def _build_planned_expense_response(self, planned_expense: PlannedExpense) -> PlannedExpenseResponse:
        return PlannedExpenseResponse(
            id=planned_expense.id,
            account_id=planned_expense.account_id,
            amount=planned_expense.amount,
            description=planned_expense.description,
            start_date=planned_expense.start_date,
            due_date=planned_expense.due_date,
            installment_number=planned_expense.installment_number,
            installment_amount=planned_expense.installment_amount,
            installments_paid=planned_expense.installments_paid,
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
            group_dal = GroupAccountMemberDAL(self.plannedExpenseDAL.db)
            members = await group_dal.get_by_account_id(account_id)
            member_ids = [m.user_id for m in members]
            if current_user.id in member_ids:
                return account
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta cuenta.")

    async def get_by_account_id(self, account_id: int, current_user: User):
        await self._validate_account_access(account_id, current_user)

        expenses = await self.plannedExpenseDAL.get_planned_expense_by_account_id(account_id)

        return [
            await self._build_planned_expense_response(t)
            for t in expenses
        ]

    async def get_by_id(self, planned_expense_id: int, current_user: User):
        expenses = await self.plannedExpenseDAL.get_planned_expense_by_id(planned_expense_id)

        if expenses is None:
            raise HTTPException(
                status_code=404,
                detail="El gasto planificado no existe.",
            )

        await self._validate_account_access(expenses.account_id, current_user)

        return await self._build_planned_expense_response(expenses)

    async def create_planed_expense(self, planned_expense: PlannedExpenseCreate, current_user: User):
        await self._validate_account_access(planned_expense.account_id, current_user)

        active_status = await self.statusDAL.get_by_name('activa')

        new_expense = PlannedExpense(
            account_id=planned_expense.account_id,
            amount=planned_expense.amount,
            description=planned_expense.description,
            start_date=planned_expense.start_date.replace(tzinfo=None),
            due_date=planned_expense.due_date.replace(tzinfo=None),
            installment_number=planned_expense.installment_number,
            installment_amount=planned_expense.installment_amount,
            installments_paid=0,
            status_id=active_status.id,
        )
        created = await self.plannedExpenseDAL.create_planned_expense(new_expense)
        return await self._build_planned_expense_response(created)

    async def update_planned_expense(self, planned_expense: PlannedExpenseRequest, current_user: User):
        existing = await self.plannedExpenseDAL.get_planned_expense_by_id(planned_expense.id)

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="El gasto planificado no existe.",
            )

        await self._validate_account_access(existing.account_id, current_user)

        existing.amount = planned_expense.amount if planned_expense.amount is not None else existing.amount
        existing.description = planned_expense.description if planned_expense.description is not None else existing.description
        existing.start_date = planned_expense.start_date.replace(tzinfo=None) if planned_expense.start_date is not None else existing.start_date
        existing.due_date = planned_expense.due_date.replace(tzinfo=None) if planned_expense.due_date is not None else existing.due_date
        existing.installment_number = planned_expense.installment_number if planned_expense.installment_number is not None else existing.installment_number
        existing.installment_amount = planned_expense.installment_amount if planned_expense.installment_amount is not None else existing.installment_amount

        updated = await self.plannedExpenseDAL.update_planned_expense(existing)
        updated = await self.plannedExpenseDAL.get_planned_expense_by_id(updated.id)
        return await self._build_planned_expense_response(updated)

    async def deactivate_planned_expense(self, planned_expense_id: int, current_user: User):
        planned_expense = await self.plannedExpenseDAL.get_planned_expense_by_id(planned_expense_id)

        if planned_expense is None:
            raise HTTPException(
                status_code=404,
                detail="El gasto planificado no existe.",
            )

        await self._validate_account_access(planned_expense.account_id, current_user)
        await self.plannedExpenseDAL.deactivate_planned_expense(planned_expense)

        return JSONResponse(
            status_code=200,
            content={"message": "Gasto planificado eliminado exitosamente.", "success": True}
        )