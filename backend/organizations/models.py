# organizations/models.py
from django.db import models
from django.core.exceptions import ValidationError

class Organization(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Add unique
    slug = models.SlugField(unique=True)
    contact_email = models.EmailField(unique=True)  # Add unique
    created_at = models.DateTimeField(auto_now_add=True)
    
    def clean(self):
        if Organization.objects.filter(name=self.name).exclude(id=self.id).exists():
            raise ValidationError({'name': 'Organization with this name already exists.'})
        if Organization.objects.filter(slug=self.slug).exclude(id=self.id).exists():
            raise ValidationError({'slug': 'Organization with this slug already exists.'})
        if Organization.objects.filter(contact_email=self.contact_email).exclude(id=self.id).exists():
            raise ValidationError({'email': 'Organization with this email already exists.'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name