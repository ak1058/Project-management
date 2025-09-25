// src/App.tsx
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo-client';
import AuthProvider from './components/AuthProvider'; 
import OrganizationDashboard from './components/OrganizationDashboard';

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider> 
        <OrganizationDashboard />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;