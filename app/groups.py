from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from .models import Group, User, db, Expense
from flask_wtf.csrf import validate_csrf

# Create groups blueprint
groups = Blueprint('groups', __name__)

@groups.route('/group/create', methods=['GET', 'POST'])
@login_required
def create_group():
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        currency = request.form.get('currency', 'USD')
        
        # Create new group
        group = Group(
            name=name,
            description=description,
            currency=currency,
            created_by_id=current_user.id
        )
        
        # Add the creator as the first member
        group.members.append(current_user)
        
        db.session.add(group)
        db.session.commit()
        
        flash('Group created successfully!', 'success')
        return redirect(url_for('groups.view_group', group_id=group.id))
    
    return render_template('create_group.html')

@groups.route('/group/<int:group_id>')
@login_required
def view_group(group_id):
    group = Group.query.get_or_404(group_id)
    
    # Check if user is a member of the group
    if current_user not in group.members:
        flash('You are not a member of this group.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    expenses = group.expenses
    balances = group.get_member_balances()
    
    return render_template('group_details.html',
                         group=group,
                         expenses=expenses,
                         balances=balances)

@groups.route('/group/<int:group_id>/add_member', methods=['POST'])
@login_required
def add_member(group_id):
    try:
        validate_csrf(request.form.get('csrf_token'))
    except:
        flash('Invalid CSRF token. Please try again.', 'danger')
        return redirect(url_for('groups.view_group', group_id=group_id))

    group = Group.query.get_or_404(group_id)
    
    # Check if current user is the group creator
    if current_user.id != group.created_by_id:
        return jsonify({'error': 'Only group admin can add members'}), 403
    
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'No user specified'}), 400
    
    user_id = data['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user in group.members:
        return jsonify({'error': 'User is already a member of this group'}), 400
    
    # Add user to group
    group.members.append(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Member added successfully',
        'user': {
            'id': user.id,
            'username': user.username
        }
    })

@groups.route('/group/<int:group_id>/update_name', methods=['POST'])
@login_required
def update_group_name(group_id):
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Invalid request format'}), 400

    try:
        validate_csrf(request.headers.get('X-CSRF-TOKEN'))
    except:
        return jsonify({'success': False, 'message': 'Invalid CSRF token'}), 400

    group = Group.query.get_or_404(group_id)
    
    # Only group creator can update the name
    if current_user.id != group.created_by_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_name = data.get('name', '').strip()
    
    if not new_name:
        return jsonify({'success': False, 'message': 'Group name cannot be empty'}), 400
        
    group.name = new_name
    db.session.commit()
    
    return jsonify({'success': True})

@groups.route('/search_users')
@login_required
def search_users():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    users = User.query.filter(User.username.ilike(f'%{query}%')).limit(5).all()
    return jsonify([{
        'id': user.id,
        'username': user.username
    } for user in users])
