# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services import hash_password, create_access_token, verify_password, verify_token
from app.models import User
from database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import traceback

router = APIRouter()  # Без префикса здесь!

auth_scheme = HTTPBearer()

@router.post("/register", response_model=TokenResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )

        hashed_password = hash_password(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        print(f"Creating token for user_id: {db_user.id}, type: {type(db_user.id)}")
        token_data = {"sub": db_user.id}
        print(f"Token data: {token_data}")
        
        access_token = create_access_token(data=token_data)
        print(f"Created token: {access_token[:50]}...")
        
        # Немедленная проверка
        verified_id = verify_token(access_token)
        print(f"Immediate verification of created token: {verified_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.from_orm(db_user)
        }
    except Exception as e:
        print("ERROR in register:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.get("/me", response_model=UserResponse)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    print("=" * 50)
    print("GET /me endpoint called")
    print(f"TOKEN RECEIVED: {token[:50]}...")
    
    user_id = verify_token(token)
    print(f"USER ID FROM TOKEN: {user_id}")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"Found user: {user.username}, id: {user.id}")
    print("=" * 50)
    
    return UserResponse.from_orm(user)