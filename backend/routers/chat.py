import json
import os
from typing import Literal

import litellm
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are an AI assistant helping a user fill out a Mutual Non-Disclosure Agreement (NDA). Your job is to ask about the NDA fields and extract values from the user's responses.

The NDA has these fields:
- purpose: Why the NDA is being created (string)
- effectiveDate: When the NDA takes effect (YYYY-MM-DD format)
- mndaTermType: Either "expires" or "continues" (whether the NDA has a fixed term or continues until terminated)
- mndaTermYears: Number of years if mndaTermType is "expires" (string number like "1" or "2")
- confidentialityTermType: Either "years" or "perpetuity"
- confidentialityTermYears: Number of years if confidentialityTermType is "years" (string number)
- governingLaw: The state whose laws govern the agreement (e.g. "Delaware")
- jurisdiction: The jurisdiction for disputes (e.g. "New Castle, DE")
- modifications: Any custom modifications to the standard terms (optional)
- party1Name: Full name of Party 1's signer
- party1Title: Job title of Party 1's signer
- party1Company: Company name of Party 1
- party1Address: Notice address (email or postal) for Party 1
- party2Name: Full name of Party 2's signer
- party2Title: Job title of Party 2's signer
- party2Company: Company name of Party 2
- party2Address: Notice address (email or postal) for Party 2

Ask about fields naturally in conversation. You can ask about multiple related fields at once. When the user provides information, extract the field values.

You MUST always respond with valid JSON in this exact format:
{"message": "your conversational reply to the user", "fields": {"fieldName": "value"}}

The "fields" object should contain only the fields you can extract from the user's latest message. If no fields can be extracted, use an empty object: {}

For mndaTermType, only use "expires" or "continues".
For confidentialityTermType, only use "years" or "perpetuity".
For effectiveDate, always use YYYY-MM-DD format.

Start by greeting the user and asking about the basic purpose of the NDA and the two parties involved."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    message: str
    fields: dict


@router.post("")
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in body.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = await litellm.acompletion(
            model=MODEL,
            messages=messages,
            api_key=api_key,
            extra_body={"provider": {"order": ["Cerebras"]}},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {str(e)}")

    content = response.choices[0].message.content
    try:
        parsed = json.loads(content)
        return ChatResponse(
            message=parsed.get("message", content),
            fields=parsed.get("fields", {}),
        )
    except json.JSONDecodeError:
        return ChatResponse(message=content, fields={})
