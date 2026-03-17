#!/usr/bin/env bash
# Run from lms-controller/frontend/
set -euo pipefail

python3 -c "
import json

for lang in ['en', 'bg']:
    with open(f'messages/{lang}.json', 'r') as f:
        d = json.load(f)

    if lang == 'en':
        d['nav']['orgs'] = 'Organizations'
        d['nav']['manageOrgs'] = 'Manage organizations'
        d['nav']['signOut'] = 'Sign out'
        d['nav']['signIn'] = 'Sign in'

        d['auth'] = {
            'welcomeBack': 'Welcome back',
            'signIn': 'Sign in to LMS',
            'email': 'Email',
            'password': 'Password',
            'signInButton': 'Sign in',
            'signingIn': 'Signing in...',
            'noAccount': 'No account?',
            'register': 'Register',
            'createAccount': 'Create account',
            'createAccountSub': 'Then create or join an organization',
            'yourName': 'Your name',
            'createButton': 'Create account',
            'creating': 'Creating...',
            'hasAccount': 'Already have an account?',
            'signInLink': 'Sign in',
            'loginRequired': 'Sign in to continue',
            'loginRequiredHint': 'You need to be logged in to access this page.',
        }

        d['orgs'] = {
            'title': 'Organizations',
            'subtitle': 'Create a new organization or join an existing one with an invite code.',
            'createTab': 'Create organization',
            'joinTab': 'Join with invite code',
            'createPlaceholder': 'Organization name',
            'create': 'Create',
            'joinPlaceholder': 'INVITE CODE',
            'join': 'Join',
            'inviteCode': 'Invite code',
            'inviteHint': 'Share this code for others to join',
            'members': 'Members',
            'leave': 'Leave',
            'leaving': 'Leaving...',
            'deleteOrg': 'Delete organization',
            'deleteConfirm': 'Delete \"{name}\" and all its data?',
            'switch': 'Switch',
            'noOrgs': 'No organizations yet',
            'noOrgsHint': 'Create one or ask a teammate for an invite code',
            'yourOrgs': 'Your organizations ({count})',
            'regenerate': 'Regenerate',
            'copied': 'Copied',
        }

    else:
        d['nav']['orgs'] = 'Организации'
        d['nav']['manageOrgs'] = 'Управление на организации'
        d['nav']['signOut'] = 'Изход'
        d['nav']['signIn'] = 'Вход'

        d['auth'] = {
            'welcomeBack': 'Добре дошли',
            'signIn': 'Вход в LMS',
            'email': 'Имейл',
            'password': 'Парола',
            'signInButton': 'Вход',
            'signingIn': 'Влизане...',
            'noAccount': 'Нямате акаунт?',
            'register': 'Регистрация',
            'createAccount': 'Създаване на акаунт',
            'createAccountSub': 'След това създайте или се присъединете към организация',
            'yourName': 'Вашето име',
            'createButton': 'Създай акаунт',
            'creating': 'Създаване...',
            'hasAccount': 'Вече имате акаунт?',
            'signInLink': 'Вход',
            'loginRequired': 'Влезте, за да продължите',
            'loginRequiredHint': 'Трябва да сте влезли в акаунта си, за да видите тази страница.',
        }

        d['orgs'] = {
            'title': 'Организации',
            'subtitle': 'Създайте нова организация или се присъединете към съществуваща с код за покана.',
            'createTab': 'Създаване на организация',
            'joinTab': 'Присъединяване с код',
            'createPlaceholder': 'Име на организацията',
            'create': 'Създай',
            'joinPlaceholder': 'КОД ЗА ПОКАНА',
            'join': 'Влез',
            'inviteCode': 'Код за покана',
            'inviteHint': 'Споделете този код, за да могат други да се присъединят',
            'members': 'Членове',
            'leave': 'Напусни',
            'leaving': 'Напускане...',
            'deleteOrg': 'Изтриване на организацията',
            'deleteConfirm': 'Изтриване на \"{name}\" и всички данни?',
            'switch': 'Превключи',
            'noOrgs': 'Все още нямате организации',
            'noOrgsHint': 'Създайте нова или помолете колега за код за покана',
            'yourOrgs': 'Вашите организации ({count})',
            'regenerate': 'Нов код',
            'copied': 'Копирано',
        }

    with open(f'messages/{lang}.json', 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
    print(f'[+] Patched messages/{lang}.json')
"
