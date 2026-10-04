from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CompanyViewSet, DashboardView, SearchView

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("search/", SearchView.as_view(), name="search"),
    *router.urls,
]
