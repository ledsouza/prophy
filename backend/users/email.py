from djoser.email import PasswordResetEmail


class UnitManagerPasswordResetEmail(PasswordResetEmail):
    template_name = "email/password_reset.html"


class ManagedUserPasswordResetEmail(PasswordResetEmail):
    template_name = "email/managed-user-password-reset.html"
