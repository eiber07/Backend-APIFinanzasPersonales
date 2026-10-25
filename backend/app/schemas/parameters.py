from pydantic import BaseModel


class ParametersResponse(BaseModel):
    id: int
    value: str


class TransactionCategoryParameterResponse(ParametersResponse):
    parent_category_id: int | None = None
    owner_id: int | None = None
    group_id: int | None = None
    account_id: int | None = None
