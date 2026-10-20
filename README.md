# LIK Insurance Management

This is our full stack web project for an online insurance website. The idea is similar to sites like Policybazaar but kept simple. A customer can register, look at different insurance plans, buy a policy and raise a claim. The admin can check the claims, approve or reject them and manage the plans.

## Modules

- Register and Login (JWT based, two roles - customer and admin)
- Insurance categories - Health, Life, Motor, Travel and Home
- Plan details page with cover, premium, duration, benefits and exclusions
- Apply for a plan, policy gets added to My Policies
- Claims - file a new claim with a PDF/image document and track the status
- Claim status flow: Submitted -> Under Review -> Approved / Rejected
- Admin panel - dashboard, review claims, open the uploaded documents, add / edit / hide plans, view users and policies
- Chatbot using Google Gemini API to answer questions about the plans

## Technologies used

- Frontend: React (Vite), React Router
- Backend: ASP.NET Core Web API (.NET 8), Entity Framework Core
- Database: PostgreSQL
- Chatbot: Google Gemini API

## Folder structure

```
backend/LIK.Api     ASP.NET Core API (controllers, models, database context, services)
frontend            React website
start.bat           starts backend and frontend together (Windows)
```

## Software needed

1. .NET SDK 8 or above - https://dotnet.microsoft.com/download
2. Node.js (LTS) - https://nodejs.org
3. PostgreSQL - https://www.postgresql.org/download/  (while installing give the password as `postgres`)

## How to run

### Step 1 - Database

Install PostgreSQL and make sure the service is running. No need to create tables manually, the backend creates the database `lik_insurance` and all tables when it runs for the first time and also adds some sample plans.

If your PostgreSQL password is not `postgres`, open `backend/LIK.Api/appsettings.json` and change it here:

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=lik_insurance;Username=postgres;Password=postgres"
```

### Step 2 - Gemini API key

Open `backend/LIK.Api/appsettings.json` and replace the text `Enter your API key here` with your key:

```json
"Gemini": {
  "ApiKey": "Enter your API key here",
  "Model": "gemini-3.5-flash-lite"
}
```

You can create a free key from https://aistudio.google.com/apikey. Whenever the key expires, just paste the new key in the same place, save the file and restart the backend. If no key is given the website still works, only the chatbot will not answer.

### Step 3 - Run

**Easy way (Windows):** double click `start.bat`. It opens two windows (backend and frontend) and then opens the website in the browser.

**Manual way:**

Backend:
```
cd backend/LIK.Api
dotnet run
```
API runs at http://localhost:5080 (Swagger at http://localhost:5080/swagger)

Frontend (in another terminal):
```
cd frontend
npm install
npm run dev
```
Website runs at http://localhost:5173

Keep both running while using the website.

## Admin login

| Email | Password |
| --- | --- |
| admin@lik.in | Admin@123 |

Customers can create their own account using the Register page.

## Database tables

| Table | Main fields |
| --- | --- |
| Users | Id, Name, Email, Phone, PasswordHash, Role |
| Categories | Id, Slug, Name, Description |
| Plans | Id, CategoryId, Provider, Name, Premium, CoverAmount, DurationDays, Benefits, Exclusions |
| Policies | Id, PolicyNumber, UserId, PlanId, StartDate, EndDate |
| Claims | Id, ClaimNumber, PolicyId, UserId, IncidentDate, Amount, Description, DocumentName, Status, Remarks |
| ClaimEvents | Id, ClaimId, Status, Note, OccurredOn |

Files uploaded with claims are saved in `backend/LIK.Api/uploads`.

## Main API routes

| Method | Route | Use |
| --- | --- | --- |
| POST | /api/auth/register | register |
| POST | /api/auth/login | login |
| GET | /api/categories | list categories |
| GET | /api/plans | list plans |
| GET | /api/plans/{id} | plan details |
| GET / POST | /api/policies | my policies / apply for a plan |
| GET / POST | /api/claims | my claims / new claim |
| GET | /api/claims/{id} | claim details |
| POST | /api/claims/{id}/document | upload claim document |
| GET | /api/claims/{id}/document | view claim document |
| GET | /api/admin/claims | all claims (admin) |
| PUT | /api/admin/claims/{id}/status | approve / reject (admin) |
| POST | /api/admin/plans | add plan (admin) |
| PUT | /api/admin/plans/{id} | edit plan (admin) |
| PUT | /api/admin/plans/{id}/toggle | hide / show plan (admin) |
| GET | /api/admin/users | all users (admin) |
| POST | /api/assistant/chat | chatbot |
