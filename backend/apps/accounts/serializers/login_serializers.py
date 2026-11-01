from typing import Any, override

from axes.handlers.proxy import AxesProxyHandler
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from rest_framework.exceptions import Throttled
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class LoginSerializer(TokenObtainPairSerializer):
    """Username + password, with the lockout of failed logins (spec 065).

    SimpleJWT calls `authenticate()`, which already counts the failures, but a locked username would only look like a wrong
    password and a good login would never clear the counter. So a locked username is refused up front with a 429 (the
    code `throttled` the frontend already handles) and a successful login sends `user_logged_in` to reset the counter.
    """

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, str]:
        request = self.context["request"]
        if not AxesProxyHandler.is_allowed(request, {"username": attrs.get(self.username_field, "")}):
            raise Throttled(wait=int(settings.AXES_COOLOFF_TIME.total_seconds()))
        data = super().validate(attrs)
        user_logged_in.send(sender=type(self.user), request=request, user=self.user)
        return data
