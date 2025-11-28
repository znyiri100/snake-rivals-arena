from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from ..models import User, LoginRequest, SignupRequest, ErrorResponse
from ..db import db
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
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
    # Find user by ID (inefficient but fine for mock)
    user = next((u for u in db.users.values() if u.id == user_id), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/login", response_model=dict)
async def login(request: LoginRequest):
    if not db.verify_password(request.email, request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = db.get_user_by_email(request.email)
    return {
        "success": True, 
        "user": user,
        "token": f"mock-token-{user.id}" # Return a mock token
    }

@router.post("/signup", response_model=dict)
async def signup(request: SignupRequest):
    if db.get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(uuid.uuid4())
    user = db.create_user(user_id, request.username, request.email, request.password)
    
    return {
        "success": True, 
        "user": user,
        "token": f"mock-token-{user.id}"
    }

@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}

@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
