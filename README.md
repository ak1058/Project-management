# 📌 Project Management System  

A full-stack **Project Management System** built with:  
- **Backend** → Django 4.x, Django REST Framework, GraphQL (Graphene), PostgreSQL  
- **Frontend** → React 18+, TypeScript, Apollo Client, TailwindCSS  
- **Database** → PostgreSQL (Dockerized)  

This system supports **organizations, projects, and task management** with a clean UI and real-time interactions.  

---

## 📜 API Documentation  

👉 [See Backend API Docs](./backend/README.md)
## 🚀 Features  

- 👥 **Organizations & Users**  
  - Create and manage organizations  
  - User registration & login  
  - Organization-based access  

- 📂 **Projects**  
  - Create, update, and delete projects  
  - Manage project statuses  
  - Navigate between organization and project views  

- ✅ **Tasks**  
  - Kanban view → Drag & drop between **To Do, In Progress, Done**  
  - List view → Simple table-style task view  
  - Task updates reflect instantly  

---

## 🐳 Setup with Docker  

> ⚡ **Note:**First in the root docker-compose.yml, please set these variables according to your system
```bash
      POSTGRES_DB: project_management
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_HOST: db
      POSTGRES_PORT: 5432
```
Clone the repository and navigate to the project root, then run: 
```bash
docker-compose up --build
```

This will spin up:  
- PostgreSQL Database  
- Backend (Django + GraphQL)  
- Frontend (React + Vite)  

> ⚡ **Note:** Database migrations run **automatically** via a shell script when the containers are built. No manual migration is required.  

---

## 📖 Getting Started  

1. **Create an Organization**  
   - Open [http://localhost:5173/createorg](http://localhost:5173/createorg)  

2. **Register / Login**  
   - Visit [http://localhost:5173](http://localhost:5173)  
   - Create an account and log in  

3. **Navigate to Organization Page**  
   - After login, you’ll be redirected to your organization dashboard  

4. **Manage Projects**  
   - Go to the **Projects** page  
   - Create projects, update their status, or delete them  

5. **Work with Tasks**  
   - Open a project → redirect to **Task Page**  
   - Choose between:  
     - **Kanban View** → Drag & drop tasks across TODO, In Progress, Done Columns.  
     - **List View** → See tasks in a detailed list 
   - You can update a task status , assign it to org members, comment on task, etc. 

---

## 🖥️ Tech Stack  

| Layer       | Tech Used                                  |
|-------------|--------------------------------------------|
| **Frontend** | React 18+, TypeScript, TailwindCSS, Apollo Client |
| **Backend**  | Django 4.x, Django REST Framework, Graphene (GraphQL), WebSockets, JWT |
| **Database** | PostgreSQL (Dockerized)                   |
| **Infra**    | Docker, Docker Compose                    |

---

## 📸 Screenshots

- **Organization Dashboard**
  <img width="1816" height="778" alt="image" src="https://github.com/user-attachments/assets/2c322da6-3d7c-441c-8669-a3b928163231" />

- **Projects Page**
- <img width="1919" height="825" alt="image" src="https://github.com/user-attachments/assets/8b745297-1594-4fc9-aa8f-989e7726bee0" />

- **Kanban & List Task Views**
  <img width="1905" height="846" alt="image" src="https://github.com/user-attachments/assets/242a661c-4e13-4361-b651-975278394d84" />
  <img width="1886" height="829" alt="image" src="https://github.com/user-attachments/assets/d338dc4e-b3e1-4d35-a510-26370b166a84" />


- **Comments (Real time on tasks)**
<img width="978" height="832" alt="image" src="https://github.com/user-attachments/assets/79080992-f461-4072-8704-ab52684d04bc" />


  

---
## 📸 Demo Video link:
[Watch the demo video](https://amitkumar.neetorecord.com/watch/041b5cc4679de4144fe9)

 

---

