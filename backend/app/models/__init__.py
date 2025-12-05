# backend/app/models/__init__.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Импортируем Base из database
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    families = relationship("FamilyMember", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="[Task.assigned_to]", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="[Task.created_by]", back_populates="creator")

class Family(Base):
    __tablename__ = "families"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    members = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="family", cascade="all, delete-orphan")

class FamilyMember(Base):
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    family = relationship("Family", back_populates="members")
    user = relationship("User", back_populates="families")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    family = relationship("Family", back_populates="tasks")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_tasks")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")