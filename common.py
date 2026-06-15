"""
Common/shared Pydantic schemas: pagination wrapper and generic responses.
"""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    detail: Optional[str] = None
