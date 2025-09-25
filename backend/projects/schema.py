import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from .models import Project, Task, TaskComment
from organizations.models import Organization
from users.models import OrganizationMember

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

class TaskType(DjangoObjectType):
    task_id = graphene.String() 
    
    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "assignee", "due_date", "created_at")
    
    def resolve_task_id(self, info):
        return self.task_id 

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author", "timestamp")

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

class Query(graphene.ObjectType):
    projects = graphene.List(ProjectType, org_slug=graphene.String(required=True))
    project = graphene.Field(ProjectType, org_slug=graphene.String(required=True), project_slug=graphene.String(required=True))
    
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

class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()
    delete_project = DeleteProject.Field()