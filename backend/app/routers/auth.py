from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import User, LoginRequest, SignupRequest, ErrorResponse
from ..sql_models import User as DBUser
from ..db import get_db
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    # In a real app, decode JWT here.
    # For mock, we'll assume the token is the user ID or email if it exists.
    # Let's just say token="mock-token-USERID"
    if not token.startswith("mock-token-"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = token.replace("mock-token-", "")
    result = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == request.email))
    user = result.scalars().first()
    
    # In a real app, use hashing!
    if not user or user.hashed_password != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True, 
        "user": User.model_validate(user),
        "token": f"mock-token-{user.id}" # Return a mock token
    }

@router.post("/signup", response_model=dict)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == request.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = DBUser(
        username=request.username,
        email=request.email,
        hashed_password=request.password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "success": True, 
        "user": User.model_validate(new_user),
        "token": f"mock-token-{new_user.id}"
    }

@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}

@router.get("/me", response_model=User)
async def get_me(current_user: DBUser = Depends(get_current_user)):
    return current_user
