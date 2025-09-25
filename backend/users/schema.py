# users/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from .models import User, OrganizationMember
from organizations.models import Organization

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'created_at')

class OrganizationType(DjangoObjectType): 
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'contact_email')

class OrganizationMemberType(DjangoObjectType):
    class Meta:
        model = OrganizationMember
        fields = ('id', 'user', 'organization', 'role')
    
    # ADD THESE RESOLVERS TO GET USER DETAILS
    name = graphene.String()
    email = graphene.String()
    
    def resolve_name(self, info):
        return self.user.name
    
    def resolve_email(self, info):
        return self.user.email

class RegisterUserInput(graphene.InputObjectType):
    email = graphene.String(required=True)
    password = graphene.String(required=True)
    name = graphene.String(required=True)
    organization_slug = graphene.String(required=True)

class RegisterUser(graphene.Mutation):
    class Arguments:
        input = RegisterUserInput(required=True)
    
    user = graphene.Field(UserType)
    token = graphene.String()
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    def mutate(self, info, input):
        try:
            # Check if user already exists
            if User.objects.filter(email=input.email).exists():
                return RegisterUser(success=False, errors=["User with this email already exists"])
            
            # Check if organization exists
            try:
                organization = Organization.objects.get(slug=input.organization_slug)
            except Organization.DoesNotExist:
                return RegisterUser(success=False, errors=["Organization not found"])
            
            # Create user
            user = User.objects.create_user(
                email=input.email,
                password=input.password,
                name=input.name
            )
            
            # Add user to organization (first user becomes ADMIN)
            member_count = OrganizationMember.objects.filter(organization=organization).count()
            role = 'ADMIN' if member_count == 0 else 'MEMBER'
            
            OrganizationMember.objects.create(
                user=user,
                organization=organization,
                role=role
            )
            
            # Generate JWT token
            from graphql_jwt.shortcuts import get_token
            token = get_token(user)
            
            return RegisterUser(user=user, token=token, success=True, errors=[])
        except Exception as e:
            return RegisterUser(success=False, errors=[str(e)])

class LoginUserInput(graphene.InputObjectType):
    email = graphene.String(required=True)
    password = graphene.String(required=True)

class LoginUser(graphene.Mutation):
    class Arguments:
        input = LoginUserInput(required=True)
    
    user = graphene.Field(UserType)
    token = graphene.String()
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    
    def mutate(self, info, input):
        from django.contrib.auth import authenticate
        
        user = authenticate(email=input.email, password=input.password)
        if user is not None:
            from graphql_jwt.shortcuts import get_token
            token = get_token(user)
            return LoginUser(user=user, token=token, success=True, errors=[])
        else:
            return LoginUser(success=False, errors=["Invalid credentials"])

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    my_organizations = graphene.List(OrganizationType)  
    organization_members = graphene.List(OrganizationMemberType, org_slug=graphene.String(required=True))  # ADD THIS
    
    @login_required
    def resolve_me(self, info):
        return info.context.user
    
    @login_required
    def resolve_my_organizations(self, info):  
        user = info.context.user
        return [member.organization for member in 
                OrganizationMember.objects.filter(user=user)]
    
    # ADD THIS RESOLVER
    @login_required
    def resolve_organization_members(self, info, org_slug):
        user = info.context.user
        # Check if user has access to this organization
        if not OrganizationMember.objects.filter(user=user, organization__slug=org_slug).exists():
            raise Exception("You don't have access to this organization")
        
        return OrganizationMember.objects.filter(organization__slug=org_slug).select_related('user')

class Mutation(graphene.ObjectType):
    register_user = RegisterUser.Field()
    login_user = LoginUser.Field()