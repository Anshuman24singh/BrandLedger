import os
from pathlib import Path
import dj_database_url
BASE_DIR=Path(__file__).resolve().parent.parent
SECRET_KEY=os.environ.get('DJANGO_SECRET_KEY','development-only-change-me')
DEBUG=os.environ.get('DEBUG','1')=='1'
ALLOWED_HOSTS=os.environ.get('ALLOWED_HOSTS','localhost,127.0.0.1').split(',')
INSTALLED_APPS=['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','rest_framework','corsheaders','core']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','whitenoise.middleware.WhiteNoiseMiddleware','corsheaders.middleware.CorsMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']
ROOT_URLCONF='config.urls'
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application'
DATABASES={'default':dj_database_url.config(default='postgresql://brandledger:brandledger@localhost:5432/brandledger',conn_max_age=60)}
AUTH_PASSWORD_VALIDATORS=[]
LANGUAGE_CODE='en-us';TIME_ZONE='UTC';USE_TZ=True
STATIC_URL='static/';STATIC_ROOT=BASE_DIR/'staticfiles'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS=[x for x in os.environ.get('FRONTEND_ORIGINS','http://localhost:5173').split(',') if x]
CSRF_TRUSTED_ORIGINS=CORS_ALLOWED_ORIGINS
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['rest_framework.authentication.TokenAuthentication','rest_framework.authentication.SessionAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated']}
INSTALLED_APPS+=['rest_framework.authtoken']
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')
