import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)

class TaskCommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("=== WebSocket Connection Attempt ===")
        logger.info(f"Scope: {self.scope}")
        logger.info(f"Headers: {self.scope.get('headers', {})}")
        
        try:
            self.org_slug = self.scope['url_route']['kwargs']['org_slug']
            self.task_id = self.scope['url_route']['kwargs']['task_id'].upper()
            self.room_group_name = f'task_comments_{self.org_slug}_{self.task_id}'

            logger.info(f"Org slug: {self.org_slug}, Task ID: {self.task_id}")

            # Check user authentication
            user = self.scope.get("user")
            logger.info(f"User object: {user}")
            logger.info(f"User type: {type(user)}")
            logger.info(f"Is anonymous: {user.is_anonymous if user else 'No user'}")

            if not user or user.is_anonymous:
                print(user,"user")
                logger.warning("Rejecting connection: Anonymous user")
                await self.close(code=4001)
                return

            # Verify user access
            has_access = await self.verify_user_access(user, self.org_slug, self.task_id)
            logger.info(f"User access verified: {has_access}")

            if not has_access:
                logger.warning("Rejecting connection: User lacks access")
                await self.close(code=4003)
                return

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            logger.info("WebSocket connection accepted successfully")
            
            # Send a welcome message
            await self.send(text_data=json.dumps({
                'type': 'system',
                'message': 'Connected to task comments',
                'task_id': self.task_id
            }))

        except Exception as e:
            logger.error(f"Error in connect method: {e}")
            await self.close(code=4000)

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected with code: {close_code}")
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message', '').strip()
            user = self.scope["user"]

            logger.info(f"Received message from user {user.email}: {message}")

            if not message:
                await self.send(text_data=json.dumps({
                    'error': 'Message cannot be empty'
                }))
                return

            # Save comment to database
            comment = await self.create_comment(message, user, self.task_id, self.org_slug)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'comment_message',
                    'id': comment.id,
                    'content': comment.content,
                    'author_email': user.email,
                    'author_id': user.id,
                    'timestamp': comment.timestamp.isoformat(),
                    'task_id': self.task_id
                }
            )
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self.send(text_data=json.dumps({
                'error': 'Failed to process message'
            }))

    async def comment_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'content': event['content'],
            'author': {
                'email': event['author_email'],
                'id': event['author_id']
            },
            'timestamp': event['timestamp'],
            'task_id': event['task_id']
        }))

    @database_sync_to_async
    def verify_user_access(self, user, org_slug, task_id):
        """Verify user has access to the organization and task exists"""
        try:
            from .models import Task
            from users.models import User, OrganizationMember
            
            logger.info(f"Verifying access for user {user.email} to org {org_slug}, task {task_id}")
            
            # Check organization membership
            org_member = OrganizationMember.objects.get(
                user=user,
                organization__slug=org_slug
            )
            logger.info(f"Organization membership found: {org_member}")
            
            # Check task exists
            task = Task.objects.get(
                task_id=task_id,
                project__organization__slug=org_slug
            )
            logger.info(f"Task found: {task.task_id} - {task.title}")
            
            return True
        except OrganizationMember.DoesNotExist:
            logger.warning(f"OrganizationMember not found for user {user.email} in org {org_slug}")
            return False
        except Task.DoesNotExist:
            logger.warning(f"Task not found: {task_id} in org {org_slug}")
            return False
        except Exception as e:
            logger.error(f"Error verifying access: {e}")
            return False

    @database_sync_to_async
    def create_comment(self, content, user, task_id, org_slug):
        """Create a new comment in database"""
        from .models import Task, TaskComment
        task = Task.objects.get(
            task_id=task_id,
            project__organization__slug=org_slug
        )
        comment = TaskComment.objects.create(
            task=task,
            content=content,
            author=user
        )
        return comment