# backend/app/services/__init__.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings

print(f"Services module loaded, JWT_SECRET: {settings.jwt_secret[:10]}...")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    truncated = password.encode("utf-8")[:72]
    return pwd_context.hash(truncated)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    truncated = plain_password.encode("utf-8")[:72]
    return pwd_context.verify(truncated, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    
    # python-jose требует, чтобы 'sub' был строкой
    if 'sub' in to_encode:
        to_encode['sub'] = str(to_encode['sub'])
    
    print(f"[create_access_token] Encoding data: {to_encode}")
    print(f"[create_access_token] Using secret: {settings.jwt_secret[:10]}...")
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
        print(f"[create_access_token] Token created: {encoded_jwt[:50]}...")
        return encoded_jwt
    except Exception as e:
        print(f"[create_access_token] Error: {e}")
        raise

def verify_token(token: str):
    try:
        print(f"[verify_token] Token received: {token[:50]}...")
        print(f"[verify_token] Using secret: {settings.jwt_secret[:10]}...")
        
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        print(f"[verify_token] Decoded payload: {payload}")
        
        user_id = payload.get("sub")
        print(f"[verify_token] User ID from token: {user_id}, type: {type(user_id)}")
        
        if user_id is None:
            print("[verify_token] No 'sub' in payload")
            return None
        
        # 'sub' будет строкой, конвертируем обратно в int
        try:
            return int(user_id)
        except (ValueError, TypeError):
            print(f"[verify_token] Cannot convert '{user_id}' to int")
            return None
            
    except JWTError as e:
        print(f"[verify_token] JWTError: {str(e)}")
        return None
    except ValueError as e:
        print(f"[verify_token] ValueError: {str(e)}")
        return None
    except Exception as e:
        print(f"[verify_token] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None