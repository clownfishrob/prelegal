from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import aiosqlite

from database import get_db
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: AuthRequest, db: aiosqlite.Connection = Depends(get_db)):
    existing = await db.execute("SELECT id FROM users WHERE username = ?", (body.username,))
    if await existing.fetchone():
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed = hash_password(body.password)
    await db.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", (body.username, hashed))
    await db.commit()
    return {"message": "User registered successfully"}


@router.post("/login")
async def login(body: AuthRequest, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id, username, hashed_password FROM users WHERE username = ?", (body.username,))
    row = await cursor.fetchone()
    if not row or not verify_password(body.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": row["username"], "user_id": row["id"]})
    return TokenResponse(access_token=token)
