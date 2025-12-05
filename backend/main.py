# backend/main.py
print("Starting House Tasks API...")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    print("FastAPI imported")
except ImportError as e:
    print(f"FastAPI import error: {e}")

try:
    from database import Base, engine
    print("Database imported")
except ImportError as e:
    print(f"Database import error: {e}")
    import traceback
    traceback.print_exc()

# Создаем приложение в любом случае
app = FastAPI(title="House Tasks API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Пробуем импортировать роутеры, но не падаем если не получится
try:
    from app.routes.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    print("Auth router imported and included")
except ImportError as e:
    print(f"Auth router import error: {e}")

try:
    from app.routes.families import router as families_router
    app.include_router(families_router, tags=["families"])
    print("Families router imported and included")
except ImportError as e:
    print(f"Families router import error: {e}")

try:
    from app.routes.tasks import router as tasks_router
    app.include_router(tasks_router, tags=["tasks"])
    print("Tasks router imported and included")
except ImportError as e:
    print(f"Tasks router import error: {e}")

@app.get("/")
def root():
    return {"message": "House Tasks API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

print("Application created successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)