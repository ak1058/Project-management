# organizations/schema.py
import graphene
from graphene_django import DjangoObjectType
from .models import Organization

class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at")

class Query(graphene.ObjectType):
    organizations = graphene.List(OrganizationType)
    
    def resolve_organizations(self, info):
        return Organization.objects.all()
    

class OrganizationInput(graphene.InputObjectType):
    name = graphene.String(required=True)
    slug = graphene.String(required=True)
    contact_email = graphene.String(required=True)

class CreateOrganization(graphene.Mutation):
    class Arguments:
        input = OrganizationInput(required=True)
    
    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    def mutate(self, info, input):
        try:
            # Check for existing data
            if Organization.objects.filter(slug=input.slug).exists():
                return CreateOrganization(success=False, errors=["Organization with this slug already exists"])
            if Organization.objects.filter(name=input.name).exists():
                return CreateOrganization(success=False, errors=["Organization with this name already exists"])
            if Organization.objects.filter(contact_email=input.contact_email).exists():
                return CreateOrganization(success=False, errors=["Organization with this email already exists"])
            
            organization = Organization.objects.create(
                name=input.name,
                slug=input.slug,
                contact_email=input.contact_email
            )
            return CreateOrganization(organization=organization, success=True, errors=[])
        except Exception as e:
            return CreateOrganization(success=False, errors=[str(e)])

class Mutation(graphene.ObjectType):
    create_organization = CreateOrganization.Field()