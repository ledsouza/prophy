from djoser.email import PasswordResetEmail


class UnitManagerPasswordResetEmail(PasswordResetEmail):
    template_name = "email/password_reset.html"
