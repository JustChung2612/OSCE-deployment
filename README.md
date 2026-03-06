<p align="center">
  <img src="https://img.shields.io/badge/Medic6-OSCE%20Exam%20Platform-14b8a6?style=for-the-badge&logo=react&logoColor=white" alt="Medic 6 Banner" />
</p>

# 🩺 Medic 6 — OSCE Exam Platform

A full-stack system for **creating, managing, and conducting online OSCE (Objective Structured Clinical Examination)** sessions for medical universities.  
Teachers can build exam rooms with patient cases, and students can take virtual station-based exams filtered by their department.

---

## 🧰 Tech Stack

| Layer | Technology |
|:------|:------------|
| 🖥️ **Frontend** | React (Vite), Zustand, Axios, React Router, SCSS |
| ⚙️ **Backend** | Node.js, Express.js |
| 🗄️ **Database** | MongoDB (Mongoose ORM) |
| 🔐 **Auth / Tokens** | JWT + Redis (for refresh token storage) |

# 🚀 Quick Guide To Run Project

## 0. Clone Project
``` 
git clone + link 
```

## 1. Install/Run Project

### 1.1 Frontend
```
1. cd frontend 
```
```
2. npm install
```
```
3. npm run dev
```
### 1.2 Backend
```
1. cd backend
```
```
2. npm install
```
```
3. npm run dev
```

## 2. Create File named <ins> .env </ins>
** Copy And Paste this into .env file: **
```
MONGO_URL = mongodb://127.0.0.1:27017/Medic-OSCE
ACCESS_TOKEN_SECRET=access_token_secret
REFRESH_TOKEN_SECRET=refresh_token_secret
GOOGLE_CLIENT_ID= ' Your Google Client ID'
```



## 3. Import data in database
1. Make sure laptop have MongoDB Compass or download it.
2. Open MongoDB Compass , hover ** localhost:27017 ** and click ** Connect **.
3. Select "Medic-OSCE" database.
4. Select "patientcases" collection.
5. Click ** Add Data ** button and choose ** Import JSON or CSV file **.
6. Open ** COS40005-ProjectA/Data ** folder in the project that just cloned and then select ** PatientCases.json ** file

