from django.contrib.admin.apps import AdminConfig


class ProphyAdminConfig(AdminConfig):
    default_site = "core.admin.ProphyAdminSite"
