# backend/app/routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from app.models import Task, Family, FamilyMember
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from database import get_db
from app.services import verify_token

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

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

# ЭТОТ ЭНДПОИНТ НУЖЕН ДЛЯ ФРОНТЕНДА
@router.get("/family/{family_id}", response_model=List[TaskResponse])
def get_family_tasks(
    family_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    print(f"[DEBUG] Getting tasks for family_id: {family_id}, user_id: {user_id}")
    
    # Проверяем, что пользователь является членом семьи
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this family")
    
    tasks = db.query(Task).filter(Task.family_id == family_id).all()
    print(f"[DEBUG] Found {len(tasks)} tasks for family {family_id}")
    
    return tasks

# Альтернативный эндпоинт с query параметром (можно удалить если не нужен)
@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    family_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
    skip: int = 0,
    limit: int = 100
):
    # Проверяем, что пользователь является членом семьи
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this family")
    
    tasks = db.query(Task).filter(Task.family_id == family_id).offset(skip).limit(limit).all()
    return tasks

@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    print(f"[DEBUG] Creating task for family_id: {task.family_id}, user_id: {user_id}")
    
    # Проверяем, что семья существует
    family = db.query(Family).filter(Family.id == task.family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Проверяем, что пользователь является членом семьи
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == task.family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this family")
    
    db_task = Task(
        family_id=task.family_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        created_by=user_id,
        assigned_to=task.assigned_to
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    print(f"[DEBUG] Task created with ID: {db_task.id}")
    return db_task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем, что пользователь имеет доступ к задаче
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == task.family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем, что пользователь имеет доступ к задаче
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == db_task.family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    # Обновляем только переданные поля
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем, что пользователь имеет доступ к задаче
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == task.family_id,
        FamilyMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}