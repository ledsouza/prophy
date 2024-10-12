from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import UserAccount

# Variable to store the old role
old_role = {}


@receiver(pre_save, sender=UserAccount)
def capture_old_role(sender, instance, **kwargs):
    try:
        old_role[instance.pk] = UserAccount.objects.get(
            pk=instance.pk).role
    except UserAccount.DoesNotExist:
        old_role[instance.pk] = None


@receiver(post_save, sender=UserAccount)
def update_user_groups(sender, instance, created, **kwargs):
    if not created:  # Only run for existing users (not new ones)
        old_role_value = old_role.pop(instance.pk, None)
        if old_role_value != instance.role:

            instance.groups.clear()
            # Add the new group
            new_group, _ = Group.objects.get_or_create(name=instance.role)
            instance.groups.add(new_group)
    else:
        new_group, _ = Group.objects.get_or_create(name=instance.role)
        instance.groups.add(new_group)
