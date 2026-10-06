"""OpenAPI additions for the error contract (spec 006).

drf-spectacular builds the success side from the serializers; the error side is one shape for the
whole API, so it is added here: the `ErrorCodeEnum` (every code the API can answer), `ErrorItem`,
`ErrorResponse`, and the error responses of each operation. The generated client then types a code
as a union, and a code the frontend does not translate fails to compile.
"""

from typing import Any

from .error_registry import all_error_codes

SCHEMAS = "#/components/schemas"
HTTP_METHODS = ("get", "post", "put", "patch", "delete")
ERROR_RESPONSE = {
    "content": {"application/json": {"schema": {"$ref": f"{SCHEMAS}/ErrorResponse"}}}
}
STATUS_DESCRIPTIONS = {
    "400": "Validation error",
    "401": "Not authenticated or invalid credentials",
    "403": "Not allowed",
    "404": "Not found",
}


def _error_statuses(path: str, method: str) -> list[str]:
    statuses = ["401", "403"]
    if method in ("post", "put", "patch"):
        statuses.insert(0, "400")
    if "{" in path:
        statuses.append("404")
    return statuses


def add_error_contract(
    result: dict[str, Any], generator: Any, request: Any, public: bool
) -> dict[str, Any]:
    """drf-spectacular postprocessing hook."""
    schemas = result.setdefault("components", {}).setdefault("schemas", {})
    schemas["ErrorCodeEnum"] = {
        "type": "string",
        "enum": all_error_codes(),
        "description": "Stable code of an error: translate it, do not parse the message.",
    }
    schemas["ErrorItem"] = {
        "type": "object",
        "required": ["field", "code", "message"],
        "properties": {
            "field": {
                "type": "string",
                "nullable": True,
                "description": "Dotted path of the field (`address.city`, `unit_people.0.person`); null when the error is not about a field.",
            },
            "code": {"$ref": f"{SCHEMAS}/ErrorCodeEnum"},
            "message": {"type": "string", "description": "English fallback message."},
        },
    }
    schemas["ErrorResponse"] = {
        "type": "object",
        "required": ["errors"],
        "properties": {
            "errors": {"type": "array", "items": {"$ref": f"{SCHEMAS}/ErrorItem"}}
        },
    }
    for path, operations in result.get("paths", {}).items():
        for method, operation in operations.items():
            if method not in HTTP_METHODS:
                continue
            responses = operation.setdefault("responses", {})
            for status in _error_statuses(path, method):
                responses.setdefault(
                    status, {"description": STATUS_DESCRIPTIONS[status], **ERROR_RESPONSE}
                )
    return result
