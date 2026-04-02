import json
import re
import os
from typing import Literal

import litellm
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.dependencies import get_current_user
from routers.templates import _load_catalog, TEMPLATES_DIR

router = APIRouter(prefix="/api/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"

FIELD_SPAN_RE = re.compile(
    r'<span\s+class="(?:coverpage|orderform|keyterms|sow)_link">([^<]+)</span>'
)


def _normalize_field_name(name: str) -> str:
    # Strip possessives: "Customer's" -> "Customer"
    if name.endswith("\u2019s"):
        return name[:-2]
    if name.endswith("'s"):
        return name[:-2]
    return name


def extract_fields_from_template(content: str) -> list[str]:
    seen: set[str] = set()
    fields: list[str] = []
    for match in FIELD_SPAN_RE.finditer(content):
        name = _normalize_field_name(match.group(1).strip())
        if name not in seen:
            # Skip if this is a plural and the singular is already present, or vice versa
            if name.endswith("s") and name[:-1] in seen:
                continue
            if name + "s" in seen:
                continue
            seen.add(name)
            fields.append(name)
    return fields


def build_selection_prompt(catalog: dict) -> str:
    lines = [
        "You are an AI assistant for Prelegal, a legal document drafting service.",
        "Your job is to help the user identify which legal document they need.",
        "",
        "Available documents:",
    ]
    for t in catalog["templates"]:
        lines.append(f'- id: "{t["id"]}", name: "{t["name"]}"')
    lines.extend([
        "",
        "Ask the user what they need. When you are confident which document fits, return its template_id.",
        "If the user asks for a document type we don't support, explain that we can't generate it, "
        "but suggest the closest available document from our catalog.",
        "",
        "You MUST always respond with valid JSON in this exact format:",
        '{"message": "your conversational reply", "template_id": "the-id" or null, "fields": {}}',
        "",
        "Set template_id to the document id string when you have identified the right document. "
        "Set it to null if you haven't identified one yet or the user's request doesn't match any document.",
        "Do not set template_id until you are confident about which document the user needs.",
        "The fields object should always be empty {} during document selection.",
        "",
        "Start by greeting the user and asking what kind of legal document they need.",
    ])
    return "\n".join(lines)


def build_field_gathering_prompt(template_name: str, fields: list[str]) -> str:
    field_list = "\n".join(f"- {f}" for f in fields)
    return f"""You are an AI assistant helping a user fill out a {template_name}. Your job is to ask about the document fields and extract values from the user's responses.

This document has these fields to fill in:
{field_list}

Ask about fields naturally in conversation. You can ask about multiple related fields at once. When the user provides information, extract the field values.

You MUST always respond with valid JSON in this exact format:
{{"message": "your conversational reply to the user", "fields": {{"Field Name": "value"}}}}

The "fields" object should contain only the fields you can extract from the user's latest message. Use the exact field names listed above as keys. If no fields can be extracted, use an empty object: {{}}

For date fields, always use YYYY-MM-DD format.

Guide the user through filling out all the fields. Start by asking about the most important fields first."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    template_id: str | None = None


class ChatResponse(BaseModel):
    message: str
    fields: dict
    template_id: str | None = None


def _parse_llm_json(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


@router.post("")
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

    if body.template_id is None:
        catalog = _load_catalog()
        system_prompt = build_selection_prompt(catalog)
    else:
        catalog = _load_catalog()
        template = None
        for t in catalog["templates"]:
            if t["id"] == body.template_id:
                template = t
                break
        if template is None:
            raise HTTPException(status_code=404, detail=f"Template not found: {body.template_id}")
        file_path = TEMPLATES_DIR / template["files"][0]
        if not file_path.is_file():
            raise HTTPException(status_code=404, detail=f"Template file not found: {template['files'][0]}")
        content = file_path.read_text()
        fields = extract_fields_from_template(content)
        system_prompt = build_field_gathering_prompt(template["name"], fields)

    messages = [{"role": "system", "content": system_prompt}]
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

    raw = response.choices[0].message.content
    try:
        parsed = _parse_llm_json(raw)
        return ChatResponse(
            message=parsed.get("message", raw),
            fields=parsed.get("fields", {}),
            template_id=parsed.get("template_id"),
        )
    except (json.JSONDecodeError, ValueError):
        return ChatResponse(message=raw, fields={})
