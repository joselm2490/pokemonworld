from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Initializes the default superuser specified in configuration'

    def handle(self, *args, **options):
        User = get_user_model()
        username = 'joselm2490'
        email = 'joselm2490@gmail.com'
        password = 'Keiler2490'

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} created successfully!'))
        else:
            user = User.objects.get(username=username)
            user.email = email
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} updated successfully!'))

