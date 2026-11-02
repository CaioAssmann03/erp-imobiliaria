from django.urls import path

from .views import DashboardView, LargestFeeListView, SearchView, UpcomingAdjustmentListView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("dashboard/adjustments/", UpcomingAdjustmentListView.as_view(), name="dashboard-adjustments"),
    path("dashboard/largest-fees/", LargestFeeListView.as_view(), name="dashboard-largest-fees"),
    path("search/", SearchView.as_view(), name="search"),
]
