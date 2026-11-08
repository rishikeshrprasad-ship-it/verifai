"""
Universal Type Cleaner & JSON Serialization Guardrail (ASG-04 FUSIONX 1.0)
Prevents 500 Internal Server Errors caused by non-serializable NumPy types
(np.float32, np.int64, np.ndarray, np.bool_) or custom objects in FastAPI responses.
"""

import math
import uuid
from datetime import datetime, date
from typing import Any, Dict, List, Union
import numpy as np
from pydantic import BaseModel
from fastapi.responses import JSONResponse

def clean_for_json(data: Any, round_floats: bool = True) -> Any:
    """
    Recursively sanitizes and normalizes any Python/NumPy data structure for JSON serialization:
    - np.floating / float -> standard Python float (rounded to 4 decimal places where applicable).
    - np.integer / int -> standard Python int.
    - np.bool_ / bool -> standard Python bool.
    - np.ndarray -> standard Python list.
    - BaseModel -> model_dump().
    - UUID, datetime, date -> ISO string.
    - NaN, Inf -> None.
    - Fallback -> str(val) for any unhandled non-primitive types.
    """
    if data is None:
        return None

    # Handle Pydantic v1 / v2 models
    if isinstance(data, BaseModel):
        if hasattr(data, "model_dump"):
            data = data.model_dump()
        elif hasattr(data, "dict"):
            data = data.dict()

    # NumPy Scalars & Native Primitives
    if isinstance(data, (np.floating, float)):
        val = float(data)
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 4) if round_floats else val

    if isinstance(data, (np.integer, int)):
        return int(data)

    if isinstance(data, (np.bool_, bool)):
        return bool(data)

    if isinstance(data, (str,)):
        return data

    if isinstance(data, np.ndarray):
        return [clean_for_json(item, round_floats) for item in data.tolist()]

    # Collections
    if isinstance(data, dict):
        return {str(k): clean_for_json(v, round_floats) for k, v in data.items()}

    if isinstance(data, (list, tuple, set)):
        return [clean_for_json(item, round_floats) for item in data]

    # Special Types
    if isinstance(data, (datetime, date)):
        return data.isoformat()

    if isinstance(data, uuid.UUID):
        return str(data)

    if isinstance(data, bytes):
        try:
            return data.decode("utf-8")
        except Exception:
            return data.hex()

    # Fallback to string representation for safe transmission
    try:
        return str(data)
    except Exception:
        return None

class SafeJSONResponse(JSONResponse):
    """FastAPI JSONResponse subclass that guarantees zero serialization crashes."""
    def render(self, content: Any) -> bytes:
        sanitized = clean_for_json(content)
        return super().render(sanitized)
