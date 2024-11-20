# Splitwise Clone

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up the database:
```bash
flask db upgrade
```

4. Run the application:
```bash
flask run
```

## Features
- User registration and authentication
- Create groups and add members
- Add and track expenses
- Split bills fairly
- View expense history and balances

## Technologies
- Backend: Flask
- Database: SQLAlchemy
- Authentication: Flask-Login
- Frontend: HTML, CSS, JavaScript
