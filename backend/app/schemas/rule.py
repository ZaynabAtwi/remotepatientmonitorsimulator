from pydantic import BaseModel


class RuleOut(BaseModel):
    id: int
    name: str
    metric: str
    operator: str
    threshold: float
    severity: str
    enabled: bool

    class Config:
        orm_mode = True
