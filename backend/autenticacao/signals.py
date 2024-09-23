from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import UserAccount

# Variable to store the old profile
old_profile = {}


@receiver(pre_save, sender=UserAccount)
def capture_old_profile(sender, instance, **kwargs):
    try:
        old_profile[instance.pk] = UserAccount.objects.get(
            pk=instance.pk).profile
    except UserAccount.DoesNotExist:
        old_profile[instance.pk] = None


@receiver(post_save, sender=UserAccount)
def update_user_groups(sender, instance, created, **kwargs):
    if not created:  # Only run for existing users (not new ones)
        old_profile_value = old_profile.pop(instance.pk, None)
        if old_profile_value != instance.profile:

            instance.groups.clear()
            # Add the new group
            new_group, _ = Group.objects.get_or_create(name=instance.profile)
            instance.groups.add(new_group)
    else:
        new_group, _ = Group.objects.get_or_create(name=instance.profile)
        instance.groups.add(new_group)
