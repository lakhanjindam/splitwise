from flask import Blueprint, request, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from .models import User, db
from werkzeug.security import check_password_hash

# Create auth blueprint
auth = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
        else:
            username = request.form.get('username')
            password = request.form.get('password')
        
        if not username or not password:
            return jsonify({
                'status': 'error',
                'message': 'Missing username or password'
            }), 400
        
        # Check if user exists
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid username or password'
            }), 401
    
    return jsonify({
        'status': 'error',
        'message': 'Method not allowed'
    }), 405

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
        else:
            username = request.form.get('username')
            email = request.form.get('email')
            password = request.form.get('password')
        
        # Validate required fields
        if not username or not email or not password:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({
                'status': 'error',
                'message': 'Username already exists'
            }), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({
                'status': 'error',
                'message': 'Email already registered'
            }), 400
        
        try:
            # Create new user
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            print(f"Setting password for {username}: {password}")  # Debug line
            
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Registration successful',
                'data': {
                    'user': {
                        'username': username,
                        'email': email
                    }
                }
            })
        except Exception as e:
            db.session.rollback()
            print(f"Registration error: {str(e)}")  # Debug line
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    return jsonify({
        'status': 'error',
        'message': 'Method not allowed'
    }), 405

@auth.route('/user')
@login_required
def get_current_user():
    return jsonify({
        'status': 'success',
        'data': {
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email
            }
        }
    })

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully'
    })
