# projects/schema.py
import graphene
from graphene_django import DjangoObjectType
from .models import Project, Task, TaskComment
from organizations.models import Organization

class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_tasks = graphene.Int()
    
    class Meta:
        model = Project
        fields = ("id", "name", "description", "status", "due_date", "created_at")
    
    def resolve_task_count(self, info):
        return self.task_set.count()
    
    def resolve_completed_tasks(self, info):
        return self.task_set.filter(status='DONE').count()

class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "assignee_email", "due_date")

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author_email", "timestamp")

# Queries for projects
class Query(graphene.ObjectType):
    projects = graphene.List(ProjectType, org_slug=graphene.String(required=True))
    
    def resolve_projects(self, info, org_slug):
        return Project.objects.filter(organization__slug=org_slug)
    

class ProjectInput(graphene.InputObjectType):
    organization_slug = graphene.String(required=True)
    name = graphene.String(required=True)
    description = graphene.String()
    status = graphene.String()
    due_date = graphene.String()

class CreateProject(graphene.Mutation):
    class Arguments:
        input = ProjectInput(required=True)
    
    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    def mutate(self, info, input):
        try:
            # Check if organization exists
            if not Organization.objects.filter(slug=input.organization_slug).exists():
                return CreateProject(success=False, errors=["Organization not found"])
            
            organization = Organization.objects.get(slug=input.organization_slug)
            
            # Create project
            project = Project.objects.create(
                organization=organization,
                name=input.name,
                description=input.description or "",
                status=input.status or "ACTIVE",
                due_date=input.due_date
            )
            return CreateProject(project=project, success=True, errors=[])
        except Exception as e:
            return CreateProject(success=False, errors=[str(e)])

class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()