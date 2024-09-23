from django.contrib import admin
from django.conf import settings


class ProphyAdminSite(admin.AdminSite):
    site_header = "Prophy"
    site_title = "Administração Prophy"
    site_url = settings.FRONTEND_URL

    def get_app_list(self, request):
        """
        Customizes the app list in the admin interface.
        """
        app_list = super().get_app_list(request)

        # Remove the "Autenticação e Autorização" app
        app_list = [app for app in app_list if app['name']
                    != 'Autenticação e Autorização']

        return app_list


admin_site = ProphyAdminSite(name='prophy_admin')
