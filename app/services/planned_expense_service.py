from fastapi import HTTPException
from fastapi.responses import JSONResponse

from app.dals.planned_expense_dal import PlannedExpenseDAL
from app.dals.status_dal import StatusDAL
from app.dals.account_dal import AccountDAL
from app.models.planned_expense import PlannedExpense
from app.models.user import User
from app.schemas.planned_expense import PlannedExpenseCreate, PlannedExpenseRequest, PlannedExpenseResponse
from dateutil.relativedelta import relativedelta

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
            id_planned_expense=planned_expense.id_planned_expense,
            installment_number=planned_expense.installment_number,
            account_id=planned_expense.account_id,
            installment_amount=planned_expense.installment_amount,
            description=planned_expense.description,
            due_date=planned_expense.due_date,
            status_id=planned_expense.status_id,
        )
    
    async def _validate_account_access(self, account_id: int, current_user: User):
        account = await self.accountDAL.get_account_by_id(account_id)

        if account is None:
            raise HTTPException(status_code=404, detail="La cuenta no existe.")

        if account.id_admin_user == current_user.id:
            return account

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
        expenses = await self.plannedExpenseDAL.get_by_account_id(account_id)
        return [await self._build_planned_expense_response(t) for t in expenses]

    async def get_by_group_and_installment(self, id_planned_expense: int, installment_number: int, current_user: User):
        expense = await self.plannedExpenseDAL.get_by_group_and_installment(id_planned_expense, installment_number)
        if expense is None:
            raise HTTPException(status_code=404, detail="La cuota no existe.")
        await self._validate_account_access(expense.account_id, current_user)
        return await self._build_planned_expense_response(expense)

    async def create_planned_expense(self, data: PlannedExpenseCreate, current_user: User):
        await self._validate_account_access(data.account_id, current_user)

        group_id = await self.plannedExpenseDAL.get_next_group_id()
        created_installments = []
        
        for i in range(1, data.installments + 1):
            due_date = data.due_date + relativedelta(months=i-1)
            installment = PlannedExpense(
                id_planned_expense=group_id,
                installment_number=i,
                account_id=data.account_id,
                installment_amount=data.installment_amount,
                description=data.description,
                due_date=due_date.replace(tzinfo=None),
                status_id=data.status_id,
            )
            created = await self.plannedExpenseDAL.create_planned_expense(installment)
            created_installments.append(created)

        return [await self._build_planned_expense_response(i) for i in created_installments]
    
    async def mark_installment_as_paid(
        self,
        id_planned_expense: int,
        installment_number: int,
        current_user: User
    ):
        installment = await self.plannedExpenseDAL.get_by_group_and_installment(
            id_planned_expense,
            installment_number
        )

        if installment is None:
            raise HTTPException(status_code=404, detail="La cuota no existe.")

        await self._validate_account_access(installment.account_id, current_user)

        updated = await self.plannedExpenseDAL.mark_installment_as_paid(
            id_planned_expense,
            installment_number
        )

        if updated is None:
            raise HTTPException(status_code=500, detail="No se pudo actualizar el estado de la cuota.")

        if await self._check_if_group_is_fully_paid(id_planned_expense):
            await self.plannedExpenseDAL.deactivate_by_group_id(id_planned_expense)

        return await self._build_planned_expense_response(updated)

    async def _check_if_group_is_fully_paid(self, id_planned_expense: int):
        expenses = await self.plannedExpenseDAL.get_by_group_id(id_planned_expense)
        return len(expenses) > 0 and all(e.status_id == 2 for e in expenses)
    
    async def deactivate_planned_expense(self, id_planned_expense: int, current_user: User):
        # desactiva todo el grupo de cuotas
        expenses = await self.plannedExpenseDAL.get_by_group_id(id_planned_expense)
        if not expenses:
            raise HTTPException(status_code=404, detail="El gasto planificado no existe.")
        await self._validate_account_access(expenses[0].account_id, current_user)
        await self.plannedExpenseDAL.deactivate_by_group_id(id_planned_expense)
        return JSONResponse(status_code=200, content={"message": "Gasto planificado eliminado exitosamente.", "success": True})
