from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    username: str
    full_name: str | None = None
    role: str
