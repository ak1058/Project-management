# websocket_auth.py
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
import jwt
from django.conf import settings

User = get_user_model()


try:
    from graphql_jwt.shortcuts import get_user_by_token
    from graphql_jwt.settings import jwt_settings
    GRAPHQL_JWT_AVAILABLE = True
except ImportError:
    GRAPHQL_JWT_AVAILABLE = False

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token):
    """Decode JWT token and get user using graphql-jwt"""
    try:

        
        if token.startswith('JWT '):
            token = token[4:]

        
        if GRAPHQL_JWT_AVAILABLE:

            user = get_user_by_token(token)

            return user
        else:
            print("graphql_jwt not available, using manual decode")
            # Fallback to manual decoding
            # Try to get JWT settings from graphql_jwt if available
            secret = getattr(settings, 'GRAPHQL_JWT', {}).get('JWT_SECRET_KEY', settings.SECRET_KEY)
            algorithm = getattr(settings, 'GRAPHQL_JWT', {}).get('JWT_ALGORITHM', 'HS256')
            
            payload = jwt.decode(
                token,
                secret,
                algorithms=[algorithm]
            )
           
            
            # Get user by email or user_id from payload
            email = payload.get('email')
            user_id = payload.get('user_id')
            username = payload.get('username')
            
            print(f"Email: {email}, User ID: {user_id}, Username: {username}")
            
            if user_id:
                user = User.objects.get(id=user_id)
            elif email:
                user = User.objects.get(email=email)
            elif username:
                user = User.objects.get(username=username)
            else:
                print("No user identifier found in payload")
                return AnonymousUser()
                
            
            return user
            
    except Exception as e:
        print(f"JWT decode error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    print("Returning AnonymousUser")
    return AnonymousUser()

from urllib.parse import parse_qs

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization")

        if auth_header:
            auth_header = auth_header.decode("utf-8")
            user = await get_user_from_jwt(auth_header)
            scope["user"] = user
        else:
            # Check query string
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            token = query_params.get("token", [None])[0]
            if token:
                user = await get_user_from_jwt(f"JWT {token}")
                scope["user"] = user
            else:
                scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    """Convenience function to create the middleware stack"""
    return JWTAuthMiddleware(inner)