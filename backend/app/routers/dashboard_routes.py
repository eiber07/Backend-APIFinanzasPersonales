from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.dals.account_dal import AccountDAL
from app.dals.budget_dal import BudgetDAL
from app.dals.dashboard_dal import DashboardDAL
from app.dals.group_account_member_dal import GroupAccountMemberDAL
from app.database.database import get_db
from app.models.user import User
from app.schemas.dashboard import MonthlyDashboardResponse
from app.services.dashboard_service import DashboardService


router = APIRouter()


def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
) -> DashboardService:
    return DashboardService(
        DashboardDAL(db),
        BudgetDAL(db),
        AccountDAL(db),
        GroupAccountMemberDAL(db),
    )


@router.get(
    "/account/{account_id}/monthly",
    response_model=MonthlyDashboardResponse,
)
async def get_monthly_dashboard(
    account_id: int,
    year: int = Query(ge=1, le=9998),
    month: int = Query(ge=1, le=12),
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.get_monthly_summary(
        account_id,
        year,
        month,
        current_user,
    )
