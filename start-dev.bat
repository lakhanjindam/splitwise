@echo off
start cmd /k "cd frontend && npm run dev"
start cmd /k "cd . && python -m flask run --port=5000"
