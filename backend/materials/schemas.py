from typing import Literal

from pydantic import BaseModel, Field


class MaterialListQuery(BaseModel):
    visibility: Literal["PUB", "INT"] | None = None
    category: str | None = None
    search: str | None = None


class SetPermissionsBody(BaseModel):
    allowed_external_user_ids: list[int] = Field(default_factory=list)
