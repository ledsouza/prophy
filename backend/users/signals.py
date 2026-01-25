from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import UserAccount


@receiver(pre_save, sender=UserAccount)
def capture_old_role(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_role = None
        return

    try:
        instance._old_role = UserAccount.objects.get(pk=instance.pk).role
    except UserAccount.DoesNotExist:
        instance._old_role = None


@receiver(post_save, sender=UserAccount)
def update_user_groups(sender, instance, created, **kwargs):
    if created:
        new_group, _ = Group.objects.get_or_create(name=instance.role)
        instance.groups.add(new_group)
        return

    old_role_value = getattr(instance, "_old_role", None)
    if old_role_value == instance.role:
        return

    instance.groups.clear()
    new_group, _ = Group.objects.get_or_create(name=instance.role)
    instance.groups.add(new_group)
