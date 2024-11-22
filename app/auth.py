from flask import Blueprint, request, jsonify, url_for
from flask_login import login_user, login_required, logout_user, current_user
from .models import User, db
from werkzeug.security import check_password_hash

# Create auth blueprint
auth = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth.route('/login', methods=['POST'])
def login():
    # Only allow POST requests
    if request.method != 'POST':
        return jsonify({
            'status': 'error',
            'message': 'Method not allowed',
            'data': None
        }), 405
    
    # Handle form data or JSON data
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
            'message': 'Missing username or password',
            'data': None
        }), 400
    
    # Check if user exists
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        login_user(user)
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    
    return jsonify({
        'status': 'error',
        'message': 'Invalid username or password',
        'data': None
    }), 401

@auth.route('/register', methods=['POST'])
def register():
    # Only allow POST requests
    if request.method != 'POST':
        return jsonify({
            'status': 'error',
            'message': 'Method not allowed',
            'data': None
        }), 405
    
    # Handle form data or JSON data
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
            'message': 'Missing required fields',
            'data': None
        }), 400
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({
            'status': 'error',
            'message': 'Username already exists',
            'data': None
        }), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({
            'status': 'error',
            'message': 'Email already registered',
            'data': None
        }), 400
    
    try:
        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Registration successful',
            'data': {
                'id': new_user.id,
                'username': username,
                'email': email
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to create account',
            'error': str(e),
            'data': None
        }), 500

@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully',
        'data': None
    })

@auth.route('/user', methods=['GET'])
@login_required
def get_current_user():
    if not current_user.is_authenticated:
        return jsonify({
            'status': 'error',
            'message': 'Not authenticated',
            'data': None
        }), 401
    
    return jsonify({
        'status': 'success',
        'message': 'User retrieved successfully',
        'data': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }
    })
