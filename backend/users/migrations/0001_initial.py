# Generated by Django 5.0.11 on 2025-02-23 17:51

import users.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('cpf', models.CharField(max_length=11, unique=True, validators=[users.validators.CPFValidator()], verbose_name='CPF')),
                ('name', models.CharField(max_length=255, verbose_name='Nome')),
                ('email', models.EmailField(max_length=255, unique=True, verbose_name='E-mail')),
                ('phone', models.CharField(max_length=11, null=True, unique=True, validators=[users.validators.MobilePhoneValidator()], verbose_name='Celular')),
                ('role', models.CharField(choices=[('FMI', 'Físico Médico Interno'), ('FME', 'Físico Médico Externo'), ('GP', 'Gerente Prophy'), ('GGC', 'Gerente Geral de Cliente'), ('GU', 'Gerente de Unidade'), ('C', 'Comercial')], default='GGC', max_length=30, verbose_name='Perfil')),
                ('is_active', models.BooleanField(default=True, help_text='Indica que o usuário será tratado como ativo. Ao invés de excluir contas de usuário, desmarque isso.', verbose_name='Conta Ativa')),
                ('is_staff', models.BooleanField(default=False, help_text='Indica que usuário consegue acessar este site de administração.', verbose_name='Acesso à Administração')),
                ('is_superuser', models.BooleanField(default=False, help_text='Indica que este usuário tem todas as permissões sem atribuí-las explicitamente.', verbose_name='Superusuário')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'Usuário',
                'verbose_name_plural': 'Usuários',
            },
        ),
    ]
