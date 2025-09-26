import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Project, Task, TaskComment
from organizations.models import Organization
from users.models import User, OrganizationMember

# Project Type
class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_tasks = graphene.Int()
    
    class Meta:
        model = Project
        fields = ("id", "name", "slug", "description", "status", "due_date", "created_at")
    
    def resolve_task_count(self, info):
        return self.task_set.count()
    
    def resolve_completed_tasks(self, info):
        return self.task_set.filter(status='DONE').count()

# Task Type
class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = ("id", "task_id", "title", "description", "status", "assignee", "due_date", "created_at")

# Task Comment Type
class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author", "timestamp", "task")

# Date Scalar
class Date(graphene.Scalar):
    @staticmethod
    def serialize(date):
        return date.isoformat()
    
    @staticmethod
    def parse_literal(node):
        if isinstance(node, graphene.StringValue):
            return node.value
        return None
    
    @staticmethod
    def parse_value(value):
        return value

# Project Input Types
class ProjectInput(graphene.InputObjectType):
    organization_slug = graphene.String(required=True)
    name = graphene.String(required=True)
    slug = graphene.String() 
    description = graphene.String()
    status = graphene.String()
    due_date = Date()

class UpdateProjectInput(graphene.InputObjectType):
    name = graphene.String()
    slug = graphene.String()
    description = graphene.String()
    status = graphene.String()
    due_date = Date()

# Task Input Types
class TaskInput(graphene.InputObjectType):
    organization_slug = graphene.String(required=True)
    project_slug = graphene.String(required=True)
    title = graphene.String(required=True)
    description = graphene.String()
    status = graphene.String()
    due_date = Date()
    assignee_email = graphene.String()  # Optional field

class UpdateTaskInput(graphene.InputObjectType):
    title = graphene.String()
    description = graphene.String()
    status = graphene.String()
    due_date = Date()
    assignee_email = graphene.String()  # Optional field

# Project Mutations
class CreateProject(graphene.Mutation):
    class Arguments:
        input = ProjectInput(required=True)
    
    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, input):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=input.organization_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return CreateProject(success=False, errors=["You don't have access to this organization"])
            
            # Check if slug is already taken in this organization
            if input.slug and Project.objects.filter(organization=organization, slug=input.slug).exists():
                return CreateProject(success=False, errors=["Project with this slug already exists in this organization"])
            
            # Create project
            project = Project.objects.create(
                organization=organization,
                name=input.name,
                slug=input.slug,  
                description=input.description or "",
                status=input.status or "ACTIVE",
                due_date=input.due_date
            )
            return CreateProject(project=project, success=True, errors=[])
        except Exception as e:
            return CreateProject(success=False, errors=[str(e)])

class UpdateProject(graphene.Mutation):
    class Arguments:
        project_slug = graphene.String(required=True)
        organization_slug = graphene.String(required=True)
        input = UpdateProjectInput(required=True)
    
    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, project_slug, organization_slug, input):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=organization_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return UpdateProject(success=False, errors=["You don't have access to this organization"])
            
            # Get the project
            try:
                project = Project.objects.get(
                    organization=organization,
                    slug=project_slug
                )
            except Project.DoesNotExist:
                return UpdateProject(success=False, errors=["Project not found"])
            
            # Check if new slug is already taken (if provided and different from current)
            if input.slug and input.slug != project.slug:
                if Project.objects.filter(organization=organization, slug=input.slug).exists():
                    return UpdateProject(success=False, errors=["Project with this slug already exists in this organization"])
            
            # Update fields
            if input.name is not None:
                project.name = input.name
            if input.slug is not None:
                project.slug = input.slug
            if input.description is not None:
                project.description = input.description
            if input.status is not None:
                project.status = input.status
            if input.due_date is not None:
                project.due_date = input.due_date
            
            project.save()
            return UpdateProject(project=project, success=True, errors=[])
        except Exception as e:
            return UpdateProject(success=False, errors=[str(e)])

class DeleteProject(graphene.Mutation):
    class Arguments:
        project_slug = graphene.String(required=True)
        organization_slug = graphene.String(required=True)
    
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, project_slug, organization_slug):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=organization_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return DeleteProject(success=False, errors=["You don't have access to this organization"])
            
            # Get the project
            try:
                project = Project.objects.get(
                    organization=organization,
                    slug=project_slug
                )
            except Project.DoesNotExist:
                return DeleteProject(success=False, errors=["Project not found"])
            
            # Delete the project (this will cascade delete tasks and comments)
            project.delete()
            return DeleteProject(success=True, errors=[])
        except Exception as e:
            return DeleteProject(success=False, errors=[str(e)])

# Task Mutations
class CreateTask(graphene.Mutation):
    class Arguments:
        input = TaskInput(required=True)
    
    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, input):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=input.organization_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return CreateTask(success=False, errors=["You don't have access to this organization"])
            
            # Get the project
            try:
                project = Project.objects.get(
                    organization=organization,
                    slug=input.project_slug
                )
            except Project.DoesNotExist:
                return CreateTask(success=False, errors=["Project not found"])
            
            # Handle assignee by email - OPTIONAL (can be null)
            assignee = None
            if input.assignee_email:
                try:
                    # Find user by email and verify they are member of the same organization
                    assignee_user = User.objects.get(email=input.assignee_email)
                    assignee_member = OrganizationMember.objects.get(
                        user=assignee_user,
                        organization=organization
                    )
                    assignee = assignee_user
                except User.DoesNotExist:
                    return CreateTask(success=False, errors=["User with this email not found"])
                except OrganizationMember.DoesNotExist:
                    return CreateTask(success=False, errors=["Assignee must be a member of the organization"])
            
            # Create task - task_id will be auto-generated in save()
            task = Task.objects.create(
                project=project,
                title=input.title,
                description=input.description or "",
                status=input.status or "TODO",
                due_date=input.due_date,
                assignee=assignee
            )
            return CreateTask(task=task, success=True, errors=[])
        except Exception as e:
            return CreateTask(success=False, errors=[str(e)])

class UpdateTask(graphene.Mutation):
    class Arguments:
        task_id = graphene.String(required=True)  # This is the actual task_id like "DB-1"
        org_slug = graphene.String(required=True)
        input = UpdateTaskInput(required=True)
    
    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, task_id, org_slug, input):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=org_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return UpdateTask(success=False, errors=["You don't have access to this organization"])
            
            # SIMPLE: Get the task directly by task_id and verify it belongs to user's organization
            try:
                task = Task.objects.get(
                    task_id=task_id.upper(),  # Use the stored task_id field
                    project__organization=organization  # Ensure task belongs to user's org
                )
            except Task.DoesNotExist:
                return UpdateTask(success=False, errors=["Task not found"])
            
            # Handle assignee update by email - OPTIONAL
            if input.assignee_email is not None:
                if input.assignee_email == "":  # Allow clearing assignee
                    task.assignee = None
                else:
                    try:
                        # Find user by email and verify they are member of the same organization
                        assignee_user = User.objects.get(email=input.assignee_email)
                        assignee_member = OrganizationMember.objects.get(
                            user=assignee_user,
                            organization=organization
                        )
                        task.assignee = assignee_user
                    except User.DoesNotExist:
                        return UpdateTask(success=False, errors=["User with this email not found"])
                    except OrganizationMember.DoesNotExist:
                        return UpdateTask(success=False, errors=["Assignee must be a member of the organization"])
            
            # Update other fields
            if input.title is not None:
                task.title = input.title
            if input.description is not None:
                task.description = input.description
            if input.status is not None:
                task.status = input.status
            if input.due_date is not None:
                task.due_date = input.due_date
            
            task.save()
            return UpdateTask(task=task, success=True, errors=[])
        except Exception as e:
            return UpdateTask(success=False, errors=[str(e)])

class DeleteTask(graphene.Mutation):
    class Arguments:
        task_id = graphene.String(required=True)  # This is the actual task_id like "DB-1"
        org_slug = graphene.String(required=True)
    
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    @login_required
    def mutate(self, info, task_id, org_slug):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=org_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return DeleteTask(success=False, errors=["You don't have access to this organization"])
            
            # SIMPLE: Get the task directly by task_id
            try:
                task = Task.objects.get(
                    task_id=task_id.upper(),
                    project__organization=organization
                )
            except Task.DoesNotExist:
                return DeleteTask(success=False, errors=["Task not found"])
            
            # Delete the task
            task.delete()
            return DeleteTask(success=True, errors=[])
        except Exception as e:
            return DeleteTask(success=False, errors=[str(e)])

# Task Comment Mutation
class CreateTaskComment(graphene.Mutation):
    class Arguments:
        org_slug = graphene.String(required=True)
        task_id = graphene.String(required=True)
        content = graphene.String(required=True)
    
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    comment = graphene.Field(TaskCommentType)
    
    @login_required
    def mutate(self, info, org_slug, task_id, content):
        try:
            user = info.context.user
            
            # Check if user belongs to the organization
            try:
                organization_member = OrganizationMember.objects.get(
                    user=user,
                    organization__slug=org_slug
                )
                organization = organization_member.organization
            except OrganizationMember.DoesNotExist:
                return CreateTaskComment(success=False, errors=["You don't have access to this organization"])
            
            # Get the task
            try:
                task = Task.objects.get(
                    task_id=task_id.upper(),
                    project__organization=organization
                )
            except Task.DoesNotExist:
                return CreateTaskComment(success=False, errors=["Task not found"])
            
            # Create comment
            comment = TaskComment.objects.create(
                task=task,
                content=content,
                author=user
            )
            
            # Send real-time update via WebSocket
            try:
                channel_layer = get_channel_layer()
                room_group_name = f'task_comments_{org_slug}_{task_id.upper()}'
                
                async_to_sync(channel_layer.group_send)(
                    room_group_name,
                    {
                        'type': 'comment_message',
                        'id': comment.id,
                        'content': comment.content,
                        'author_email': user.email,
                        'author_id': user.id,
                        'timestamp': comment.timestamp.isoformat(),
                        'task_id': task_id.upper()
                    }
                )
            except Exception as e:
                # WebSocket might not be available, but comment is still saved
                print(f"WebSocket error: {e}")
            
            return CreateTaskComment(success=True, errors=[], comment=comment)
        except Exception as e:
            return CreateTaskComment(success=False, errors=[str(e)])

# Query Class
class Query(graphene.ObjectType):
    projects = graphene.List(ProjectType, org_slug=graphene.String(required=True))
    project = graphene.Field(ProjectType, org_slug=graphene.String(required=True), project_slug=graphene.String(required=True))
    tasks = graphene.List(TaskType, org_slug=graphene.String(required=True), project_slug=graphene.String(required=True))
    task = graphene.Field(TaskType, org_slug=graphene.String(required=True), task_id=graphene.String(required=True))
    task_comments = graphene.List(TaskCommentType, org_slug=graphene.String(required=True), task_id=graphene.String(required=True))
    
    @login_required
    def resolve_projects(self, info, org_slug):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        return Project.objects.filter(organization__slug=org_slug)
    
    @login_required
    def resolve_project(self, info, org_slug, project_slug):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        
        try:
            return Project.objects.get(organization__slug=org_slug, slug=project_slug)
        except Project.DoesNotExist:
            return None
    
    @login_required
    def resolve_tasks(self, info, org_slug, project_slug):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        
        try:
            project = Project.objects.get(organization__slug=org_slug, slug=project_slug)
            return Task.objects.filter(project=project)
        except Project.DoesNotExist:
            return []
    
    @login_required
    def resolve_task(self, info, org_slug, task_id):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        
        try:
            # SIMPLE: Get task directly by task_id and organization
            return Task.objects.get(
                task_id=task_id.upper(),
                project__organization__slug=org_slug
            )
        except Task.DoesNotExist:
            return None
    
    @login_required
    def resolve_task_comments(self, info, org_slug, task_id):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        
        try:
            task = Task.objects.get(
                task_id=task_id.upper(),
                project__organization__slug=org_slug
            )
            return TaskComment.objects.filter(task=task).order_by('timestamp')
        except Task.DoesNotExist:
            return []

# Mutation Class
class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    delete_task = DeleteTask.Field()
    create_task_comment = CreateTaskComment.Field()

# Schema
schema = graphene.Schema(query=Query, mutation=Mutation)