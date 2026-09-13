from pydantic import BaseModel


class ParametersResponse(BaseModel):
    id: int
    value: str

