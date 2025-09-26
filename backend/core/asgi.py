import os
import django
from django.core.asgi import get_asgi_application


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')


django.setup()


from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from projects.routing import websocket_urlpatterns


from projects.websocket_auth import JWTAuthMiddlewareStack  

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(  
        URLRouter(
            websocket_urlpatterns
        )
    ),
})