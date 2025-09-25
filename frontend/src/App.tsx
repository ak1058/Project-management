// src/App.tsx
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo-client';
import OrganizationDashboard from './components/OrganizationDashboard';


function App() {
  return (
    <ApolloProvider client={client}>
      <OrganizationDashboard />
    </ApolloProvider>
  );
}

export default App;