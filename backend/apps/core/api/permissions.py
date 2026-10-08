from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsSuperuser(BasePermission):
    """Only superusers (support): creating or deleting a company is not a staff action."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
