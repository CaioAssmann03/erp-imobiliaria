from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import LoginView, LogoutView, RefreshView

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),

    path("api/auth/login/", LoginView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="token_logout"),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),

    path("api/", include("apps.core.urls")),
    path("api/", include("apps.condominiums.urls")),
    path("api/", include("apps.persons.urls")),
    path("api/", include("apps.finance.urls")),
    path("api/", include("apps.billing.urls")),
]
