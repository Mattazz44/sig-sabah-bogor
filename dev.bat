@echo off
echo Starting SIG Wisata Bogor (Backend & Frontend)...
start "SIG Backend (Laravel)" cmd /k "cd backend && php artisan serve"
start "SIG Frontend (Vite)" cmd /k "cd ""Front end"" && npm run dev"
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000
pause
