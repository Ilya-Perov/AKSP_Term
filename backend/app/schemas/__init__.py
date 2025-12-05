from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FamilyBase(BaseModel):
    name: str

class FamilyCreate(FamilyBase):
    pass

class FamilyResponse(FamilyBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None

class TaskCreate(TaskBase):
    family_id: int
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

class TaskResponse(TaskBase):
    id: int
    family_id: int
    assigned_to: Optional[int] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class FamilyMemberResponse(BaseModel):
    id: int
    user_id: int
    family_id: int
    role: str
    joined_at: datetime
    user: UserResponse 
    
    class Config:
        from_attributes = True

class FamilyDetailResponse(FamilyResponse):
    members: List[FamilyMemberResponse]
    tasks: List[TaskResponse]
