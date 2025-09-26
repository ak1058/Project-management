# ⚙️ Backend - Project Management System  

This is the **backend service** for the Project Management System.  
It is built using **Django 4.x**, **Django REST Framework**, **GraphQL (Graphene)**, and **PostgreSQL**.  
Authentication is handled using **JWT tokens**, and **WebSockets** power real-time features.  

---

## 🚀 Features & Functionalities  

### 🏢 Organizations App  
**Features:**  
- Create new organizations with unique slug/name/email  
- Get organization details and listings  
- Enforce uniqueness on organization data  

**Models:**  
- `Organization`: Core organization entity  

📖 API Documentation → [backend/organization/README.md](./organization/README.md)  

---

### 👥 Users App  
**Features:**  
- User registration with email/password  
- JWT authentication (login/logout)  
- Organization membership management  
- Role-based permissions (**ADMIN** / **MEMBER**)  

**Models:**  
- `User`: Custom user model (email as username)  
- `OrganizationMember`: User-Organization relationship with roles  

📖 API Documentation → [backend/users/README.md](./users/README.md)  

---

### 📊 Projects App  
**Features:**  
- Project creation and management  
- Task management within projects  
- Task comments with real-time updates  
- Automatic task ID generation (e.g., `PROJ-1`, `PROJ-2`)  
- Project status tracking (**ACTIVE, COMPLETED, ON_HOLD**)  
- Task status workflow (**TODO, IN_PROGRESS, DONE**)  

**Models:**  
- `Project`: Organization's project container  
- `Task`: Individual tasks within projects  
- `TaskComment`: Comments on tasks (real-time using WebSockets)  

📖 API Documentation → [backend/projects/README.md](./projects/README.md)  

---

## 🛡️ Security & Access Control  

### 🔑 Authentication  
- JWT tokens required for all authenticated requests  
- Email/password login system  
- Token-based session management  

### 👮 Authorization  
- Organization-level data isolation  
- Role-based permissions (**ADMIN** can manage members)  
- Member-level access control  
- Projects & tasks restricted to organization members  

### ✅ Validation  
- Unique constraints (email, slugs)  
- Input validation on all mutations  
- Organization membership verification  
- Data ownership checks  

---

## 🔄 Real-time Features  

### 🌐 WebSocket Support  
- Live task comment updates  
- Real-time notification system  
- Comment broadcasting flow:  

```
User comments → Save to DB → Broadcast via WebSocket → Update all clients
```

---

## 🖥️ Tech Stack  

| Layer       | Tech Used                                  |
|-------------|--------------------------------------------|
| **Backend**  | Django 4.x, Django REST Framework, Graphene (GraphQL) |
| **Database** | PostgreSQL                                |
| **Auth**     | JWT (JSON Web Tokens)                     |
| **Realtime** | Django Channels + WebSockets              |
| **Infra**    | Docker, Docker Compose                    |
