from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from .models import Group, User, db, Expense, ExpenseSplit, group_members
from flask_wtf.csrf import validate_csrf

# Create groups blueprint
groups = Blueprint('groups', __name__, url_prefix='/api/groups')

@groups.route('/create', methods=['GET', 'POST'])
@login_required
def create_group():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            name = data.get('name')
            currency = data.get('currency', 'USD')
            member_ids = data.get('members', [])
        else:
            name = request.form.get('name')
            currency = request.form.get('currency', 'USD')
            member_ids = []
        
        if not name:
            if request.is_json:
                return jsonify({
                    'status': 'error',
                    'message': 'Name is required'
                }), 400
            flash('Group name is required', 'error')
            return redirect(url_for('groups.create_group'))
        
        # Create new group
        group = Group(
            name=name,
            currency=currency,
            created_by_id=current_user.id
        )
        
        # Add the creator as the first member
        group.members.append(current_user)
        
        # Add selected members
        if member_ids:
            members = User.query.filter(User.id.in_(member_ids)).all()
            for member in members:
                if member != current_user and member not in group.members:
                    group.members.append(member)
        
        db.session.add(group)
        db.session.commit()
        
        if request.is_json:
            return jsonify({
                'status': 'success',
                'data': {
                    'id': group.id,
                    'name': group.name,
                    'currency': group.currency,
                    'members': [{
                        'id': member.id,
                        'username': member.username
                    } for member in group.members]
                }
            })
            
        flash('Group created successfully!', 'success')
        return redirect(url_for('groups.view_group', group_id=group.id))
    
    return render_template('create_group.html')

@groups.route('/<int:group_id>', methods=['GET'])
@login_required
def view_group(group_id):
    group = Group.query.get_or_404(group_id)
    
    # Check if user is a member of the group
    if current_user not in group.members:
        return jsonify({
            'status': 'error',
            'message': 'You are not a member of this group.'
        }), 403
    
    # Get group expenses
    expenses = [{
        'id': expense.id,
        'description': expense.description,
        'amount': expense.amount,
        'date': expense.date.isoformat() if expense.date else None,
        'group_id': expense.group_id,
        'payer_id': expense.payer_id,
        'currency': expense.currency,
        'payer': {
            'id': expense.payer.id,
            'username': expense.payer.username,
            'email': expense.payer.email
        } if expense.payer else None,
        'splits': [{
            'id': split.id,
            'expense_id': split.expense_id,
            'user_id': split.user_id,
            'amount': split.amount,
            'is_settled': split.is_settled,
            'settled_at': split.settled_at.isoformat() if split.settled_at else None,
            'user': {
                'id': split.user.id,
                'username': split.user.username,
                'email': split.user.email
            } if split.user else None
        } for split in expense.splits]
    } for expense in group.expenses]
    
    # Calculate member balances
    balances = {}
    for member in group.members:
        # Amount member has paid
        paid = sum(e.amount for e in group.expenses if e.payer_id == member.id)
        # Amount member owes
        owes = sum(s.amount for e in group.expenses for s in e.splits if s.user_id == member.id)
        balances[member.id] = paid - owes
    
    return jsonify({
        'status': 'success',
        'group': {
            'id': group.id,
            'name': group.name,
            'currency': group.currency,
            'created_by': {
                'id': group.created_by.id,
                'username': group.created_by.username
            },
            'members': [{
                'id': member.id,
                'username': member.username,
                'email': member.email
            } for member in group.members],
            'total_expenses': sum(e.amount for e in group.expenses),
            'member_count': len(group.members),
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        },
        'expenses': expenses,
        'balances': balances
    })

@groups.route('/<int:group_id>/members', methods=['POST'])
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

@groups.route('/<int:group_id>/name', methods=['PUT'])
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

@groups.route('/<int:group_id>', methods=['DELETE'])
@login_required
def delete_group(group_id):
    try:
        validate_csrf(request.form.get('csrf_token'))
    except:
        flash('Invalid CSRF token. Please try again.', 'danger')
        return redirect(url_for('main.dashboard'))

    group = Group.query.get_or_404(group_id)
    
    # Only group creator can delete the group
    if current_user.id != group.created_by_id:
        flash('You are not authorized to delete this group.', 'danger')
        return redirect(url_for('groups.view_group', group_id=group_id))
    
    # Delete all expenses in the group
    expenses = Expense.query.filter_by(group_id=group_id).all()
    for expense in expenses:
        # Delete all splits for each expense
        ExpenseSplit.query.filter_by(expense_id=expense.id).delete()
        db.session.delete(expense)
    
    # Delete all user-group associations using the group_members table
    db.session.execute(group_members.delete().where(group_members.c.group_id == group_id))
    
    # Delete the group
    db.session.delete(group)
    db.session.commit()
    
    flash('Group has been deleted successfully.', 'success')
    return redirect(url_for('main.dashboard'))

@groups.route('/', methods=['GET'])
@login_required
def get_groups():
    # Get all groups where the current user is a member
    user_groups = current_user.groups
    
    return jsonify({
        'status': 'success',
        'data': {
            'groups': [{
                'id': group.id,
                'name': group.name,
                'currency': group.currency,
                'created_by': {
                    'id': group.created_by.id if group.created_by else None,
                    'username': group.created_by.username if group.created_by else 'Unknown'
                },
                'members': [{
                    'id': member.id,
                    'username': member.username,
                    'email': member.email
                } for member in group.members],
                'total_expenses': sum(expense.amount for expense in group.expenses),
                'member_count': len(group.members),
                'created_at': group.created_at.isoformat() if group.created_at else None,
                'updated_at': group.updated_at.isoformat() if group.updated_at else None
            } for group in user_groups]
        }
    })

@groups.route('/users/search', methods=['GET'])
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

@groups.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.all()
    return jsonify({
        'status': 'success',
        'data': {
            'users': [{
                'id': user.id,
                'username': user.username,
                'email': user.email
            } for user in users]
        }
    })
