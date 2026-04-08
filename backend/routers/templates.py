import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/templates", tags=["templates"])

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


@lru_cache
def _load_catalog() -> dict:
    catalog_path = TEMPLATES_DIR / "catalog.json"
    with open(catalog_path) as f:
        return json.load(f)


@router.get("")
async def list_templates():
    return _load_catalog()


@router.get("/{template_id}")
async def get_template(template_id: str):
    catalog = _load_catalog()
    for template in catalog["templates"]:
        if template["id"] == template_id:
            first_file = template["files"][0]
            file_path = TEMPLATES_DIR / first_file
            if not file_path.is_file():
                raise HTTPException(status_code=404, detail=f"Template file not found: {first_file}")
            content = file_path.read_text()
            return {"id": template["id"], "name": template["name"], "content": content}
    raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
