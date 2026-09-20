from pydantic import BaseModel, EmailStr, Field


class Credentials(BaseModel):
    email: EmailStr
    password: str


class SignUp(Credentials):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class User(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    is_active: bool


class Token(BaseModel):
    token: str
