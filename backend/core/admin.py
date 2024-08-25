from django.contrib import admin
from django.conf import settings


class ProphyAdminSite(admin.AdminSite):
    site_header = "Prophy"
    site_title = "Administração Prophy"
    site_url = settings.FRONTEND_URL


admin_site = ProphyAdminSite(name='prophy_admin')
