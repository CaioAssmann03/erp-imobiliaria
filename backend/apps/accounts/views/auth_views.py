from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from typing_extensions import final

from apps.core.throttling import TrustedProxyScopedRateThrottle

from ..serializers import LogoutSerializer
from ..services.revoke_refresh_token import revoke_refresh_token


@final
class LoginView(TokenObtainPairView):
    """Username + password -> access and refresh tokens (rate limited)."""

    throttle_classes = (TrustedProxyScopedRateThrottle,)
    throttle_scope = "auth_login"


@final
class RefreshView(TokenRefreshView):
    """A refresh token -> a new access token and a rotated refresh token (the old one is revoked)."""

    throttle_classes = (TrustedProxyScopedRateThrottle,)
    throttle_scope = "auth_refresh"


@final
class LogoutView(APIView):
    """Revokes a refresh token. Idempotent: it always answers 204 and never says whether the token was valid."""

    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (TrustedProxyScopedRateThrottle,)
    throttle_scope = "auth_logout"

    @extend_schema(request=LogoutSerializer, responses={204: None}, operation_id="auth_logout_create")
    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        revoke_refresh_token(serializer.validated_data["refresh"])
        return Response(status=status.HTTP_204_NO_CONTENT)
