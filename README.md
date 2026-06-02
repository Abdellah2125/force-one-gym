# 💪 Force One Gym - Gym Management System

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **Complete Frontend Gym Management System**

A fully functional web-based system for managing a gym, including client-facing pages and an admin dashboard. Built with HTML5, CSS3, and JavaScript (ES6+) using localStorage for data persistence.

🌐 **Live Demo:** [https://abdellah2125.github.io/force-one-gym/](https://abdellah2125.github.io/force-one-gym/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Pages](#pages)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Login Credentials](#login-credentials)
- [How to Run](#how-to-run)
- [Default Data](#default-data)
- [Responsive Design](#responsive-design)
- [Future Development](#future-development)
- [Team](#team)

---

## 🎯 Overview

**Force One Gym** is a complete frontend web application that manages gym operations:

- Display classes, trainers, and membership plans
- New member registration with real-time validation
- Complete admin dashboard (manage members, classes, plans, messages)
- Simulated data storage using `localStorage`

> ⚠️ **Note:** This version represents Parts 1, 2, and 3 (HTML, CSS, JavaScript). The backend (PHP/MySQL) will be added in Part 4.

---

## ✨ Key Features

### 👥 Client Pages

| Feature | Description |
|---------|-------------|
| 🏠 **Home Page** | Hero section, live stats (members, classes, popular plan), facilities and plans display |
| 📅 **Classes Page** | Filter by trainer/day/difficulty, sortable columns (name, time, duration), colored difficulty badges |
| 💳 **Membership Page** | Plan cards (Bronze/Silver/Gold), plan selection cart (sessionStorage), registration form with validation |
| 👨‍🏫 **Trainers Page** | Trainer cards grid, live search (name/specialty), modal popup with full details |
| 📧 **Contact Page** | Real-time validation, character counter, toast notifications, localStorage message storage |

### 🔧 Admin Dashboard

| Feature | Description |
|---------|-------------|
| 🔐 **Login** | Simulated authentication (admin/admin123) |
| 📊 **Dashboard** | Dynamic stats (members count, classes count, popular plan), bar chart, recent members (5) |
| 👥 **Member Management** | Full CRUD, live search, filter by plan, dynamic member count |
| 🏋️ **Class Management** | Full CRUD, duplicate prevention (same trainer/day/time), difficulty badges |
| 📋 **Plan Management** | Full CRUD for membership plans, feature display |
| 💬 **Message Management** | View contact messages, mark as read/unread, delete individually or all |

### ⚡ JavaScript Features

- ✅ Real-time validation with colored error messages
- ✅ Dynamic filtering & sorting
- ✅ localStorage & sessionStorage for data persistence
- ✅ Toast notifications (success/error)
- ✅ Modal popups for editing and details
- ✅ Live search functionality
- ✅ Dynamic dashboard stats + CSS bar chart
- ✅ Cross-tab data synchronization (storage event)

---

## 📑 Pages

### Client Pages (5 pages)

| File | Description |
|------|-------------|
| `index.html` | Home page - welcome, stats, facilities, plans |
| `classes.html` | Classes table with filtering and sorting options |
| `membership.html` | Plan cards + membership registration form |
| `trainers.html` | Trainers display with search and detail modal |
| `contact.html` | Contact form with message storage |

### Admin Pages (6 pages)

| File | Description |
|------|-------------|
| `admin-login.html` | Admin login page |
| `admin-dashboard.html` | Main dashboard (stats and chart) |
| `admin-members.html` | Member management (CRUD + search + filter) |
| `admin-classes.html` | Class management (CRUD + duplicate prevention) |
| `admin-plans.html` | Plan management (CRUD) |
| `admin-messages.html` | Contact messages management |

---

## 🛠️ Technologies Used

| Technology | Usage |
|------------|-------|
| **HTML5** | Semantic page structure |
| **CSS3** | Styling and responsiveness (Flexbox, Grid, Media Queries, CSS Variables) |
| **JavaScript (ES6+)** | Interactivity, DOM manipulation, local storage |
| **LocalStorage API** | Data storage (database simulation) |
| **SessionStorage API** | Selected plan persistence across pages |
| **Google Fonts** | Oswald (headings) + Roboto (body) |
| **FontAwesome** | Icons (version 6.4.0) |

---

## 📁 Project Structure
force-one-gym/
│
├── 📄 index.html # Home page
├── 📄 classes.html # Classes page
├── 📄 membership.html # Membership page
├── 📄 trainers.html # Trainers page
├── 📄 contact.html # Contact page
│
├── 📄 admin-login.html # Admin login
├── 📄 admin-dashboard.html # Admin dashboard
├── 📄 admin-members.html # Member management
├── 📄 admin-classes.html # Class management
├── 📄 admin-plans.html # Plan management
├── 📄 admin-messages.html # Message management
│
├── 📁 css/
│ ├── 📄 style.css # Client styles
│ └── 📄 admin.css # Admin styles
│
├── 📁 js/
│ ├── 📄 data-config.js # Default data + StorageAPI
│ ├── 📄 main.js # Client-side logic
│ └── 📄 admin.js # Admin-side logic
│
├── 📁 imag/ # Images and logo
│ ├── 🖼️ logo.jpg
│ ├── 🖼️ img1.jpg
│ ├── 🖼️ trainers 1.jpg
│ ├── 🖼️ trainers 2.jpg
│ ├── 🖼️ trainers 3.jpg
│ ├── 🖼️ trainers 4.jpg
│ └── 🖼️ trainers 5.jpg
│
└── 📄 README.md # This file

text

---

## 🔐 Login Credentials

### Admin Account (Simulated)

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

> ⚠️ This is **simulated** authentication using `sessionStorage`. It will be replaced with real authentication (PHP/MySQL) in Part 4.

---

## 🚀 How to Run

### Method 1: Local Execution

```bash
# 1. Clone the repository
git clone https://github.com/abdellah2125/force-one-gym.git

# 2. Navigate to the project folder
cd force-one-gym

# 3. Open index.html in your browser
open index.html
Method 2: Live Demo
https://abdellah2125.github.io/force-one-gym/

Note: The project runs entirely in the browser without a server (localStorage handles data persistence).

📊 Default Data
Type	Count	Details
Members	5	Amine, Riad, Nassim, Sofiane, Abderrahmane
Classes	5	Bodybuilding, Boxing, Karate, HIIT, Weightlifting
Plans	3	🥉 Bronze (2000 DA), 🥈 Silver (8000 DA), 🥇 Gold (40000 DA)
Trainers	5	Omar, Yacine, Walid, Karim, Samir (with images and bios)
Messages	-	Added via contact form
📱 Responsive Design
Screen	Width	Layout
Desktop	≥ 1024px	Multi-column layout, fixed sidebar in admin
Tablet	768px - 1023px	2 columns, top navigation bar in admin
Mobile	< 768px	Single column, touch-friendly tap targets (≥44px)
Mobile-First Approach used with appropriate breakpoints.

🔮 Future Development (Part 4 - PHP/MySQL)
Planned features for Part 4:

Real MySQL database (tables: users, plans, classes, trainers, bookings, contact_messages)

Secure authentication system (password_hash, sessions)

New member registration in database

Class booking system for members

Fully dynamic admin dashboard (real data)

CSV data export

Revenue reports

Security against XSS, CSRF, SQL Injection

REST API endpoint for filtering (JSON)

Email notifications (PHP mail())

✅ Project Requirements Met
Requirement	Status
HTML5 semantic elements	✅
CSS variables (--primary, --accent, ...)	✅
Flexbox + CSS Grid	✅
Media queries (3 breakpoints)	✅
JavaScript ES6+ (no external libraries)	✅
localStorage / sessionStorage	✅
Form validation (client-side)	✅
Filtering & sorting (classes)	✅
Modal popup (trainers)	✅
Toast notifications	✅
Admin CRUD (members, classes, plans)	✅
Dynamic dashboard stats	✅
Contact messages storage	✅
## 👤 Developed By

**Name:** [Abdellah]  
**Institution:** Constantine 2 University - Abdelhamid Mehri  
**Unit:** Web Application Development (DAW)  
**Level:** Year 2 (L2)

📧 Contact
Method	Information
Email	ForceOneGym@gmail.com
Phone	+213664763765
Address	UV2, Ali Mendjeli, Constantine, Algeria
<div align="center">
⭐ If you like this project, don't forget to star it on GitHub! ⭐

© 2026 Force One Gym - All Rights Reserved

</div> ```