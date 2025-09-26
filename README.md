# 📌 Project Management System  

A full-stack **Project Management System** built with:  
- **Backend** → Django 4.x, Django REST Framework, GraphQL (Graphene), PostgreSQL  
- **Frontend** → React 18+, TypeScript, Apollo Client, TailwindCSS  
- **Database** → PostgreSQL (Dockerized)  

This system supports **organizations, projects, and task management** with a clean UI and real-time interactions.  

---

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

## 📸 Screenshots (Optional)  

- **Organization Dashboard**  
- **Projects Page**  
- **Kanban & List Task Views**  

*(You can add screenshots here for a better visual overview.)*  

---

## 🤝 Contributing  

1. Fork the repo  
2. Create a feature branch  
3. Commit changes  
4. Open a Pull Request 🚀  

---

## 📜 API Documentation  

👉 [See Backend API Docs](./backend/README.md)
