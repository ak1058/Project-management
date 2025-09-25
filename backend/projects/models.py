from django.db import models
from django.utils.text import slugify
from organizations.models import Organization
from users.models import User

# projects/models.py
class Project(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'), 
        ('ON_HOLD', 'On Hold'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=50, unique=True)    
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

class Task(models.Model):
    TASK_STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES, default='TODO')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    @property
    def task_id(self):
        """Generate project-specific task ID like BLIB-1, BLIB-2, etc."""

        project_tasks = Task.objects.filter(project=self.project).order_by('id')

        task_number = list(project_tasks).index(self) + 1
        return f"{self.project.slug}-{task_number}"

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.author.email if self.author else 'Unknown'} on {self.task.title}"