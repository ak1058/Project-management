import graphene
import graphql_jwt
from organizations.schema import Query as OrganizationQuery, Mutation as OrganizationMutation
from projects.schema import Query as ProjectQuery, Mutation as ProjectMutation
from users.schema import Query as UserQuery, Mutation as UserMutation

class Query(OrganizationQuery, ProjectQuery, UserQuery, graphene.ObjectType):
    pass

class Mutation(OrganizationMutation, ProjectMutation, UserMutation, graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)