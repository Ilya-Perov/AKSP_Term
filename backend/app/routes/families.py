# backend/app/routes/families.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.schemas import FamilyCreate, FamilyResponse, FamilyDetailResponse
from app.models import Family, FamilyMember, User, Task
from app.services import verify_token
from database import get_db
import traceback

router = APIRouter(prefix="/api/families", tags=["families"])

def get_current_user_id(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_id

@router.post("", response_model=FamilyResponse)
def create_family(family: FamilyCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        print(f"[DEBUG] Creating family. User ID: {user_id}, Family name: {family.name}")
        
        # Создаем семью
        db_family = Family(name=family.name, created_by=user_id)
        db.add(db_family)
        db.flush()  # Получаем ID без коммита
        
        print(f"[DEBUG] Family created with ID: {db_family.id}")
        
        # Добавляем создателя в семью
        member = FamilyMember(family_id=db_family.id, user_id=user_id, role="admin")
        db.add(member)
        
        db.commit()
        db.refresh(db_family)
        
        print(f"[DEBUG] FamilyMember created. Family ID: {db_family.id}, User ID: {user_id}")
        
        return FamilyResponse.from_orm(db_family)
        
    except Exception as e:
        print(f"[ERROR] Failed to create family: {e}")
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create family: {str(e)}")

@router.get("", response_model=list[FamilyResponse])
def list_families(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        print(f"[DEBUG] Getting families for user_id: {user_id}")
        
        families = db.query(Family).join(FamilyMember).filter(
            FamilyMember.user_id == user_id
        ).all()
        
        print(f"[DEBUG] Found {len(families)} families")
        
        result = [FamilyResponse.from_orm(f) for f in families]
        return result
        
    except Exception as e:
        print(f"[ERROR] Failed to get families: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get families: {str(e)}")


@router.post("/{family_id}/members")
def add_member_by_name(
    family_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="Username required")

    # Проверка: админ ли текущий пользователь
    admin_check = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id,
        FamilyMember.role == "admin"
    ).first()

    if not admin_check:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    # Ищем пользователя по имени
    new_user = db.query(User).filter(User.username == username).first()
    if not new_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Уже в семье?
    exists = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == new_user.id
    ).first()

    if exists:
        raise HTTPException(status_code=400, detail="User already a member")

    # Добавляем
    member = FamilyMember(family_id=family_id, user_id=new_user.id, role="member")
    db.add(member)
    db.commit()
    db.refresh(member)

    return member

@router.get("/{family_id}", response_model=FamilyDetailResponse)
def get_family_detail(
    family_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    # Проверяем, что пользователь член семьи
    member = db.query(FamilyMember).filter(
        (FamilyMember.family_id == family_id) &
        (FamilyMember.user_id == user_id)
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="Not a family member")

    # Загружаем вместе: участников и задачи
    members = db.query(FamilyMember).filter(FamilyMember.family_id == family_id).all()
    tasks = db.query(Task).filter(Task.family_id == family_id).all()

    return FamilyDetailResponse(
        id=family.id,
        name=family.name,
        created_by=family.created_by,
        created_at=family.created_at,
        members=members,
        tasks=tasks,
    )
