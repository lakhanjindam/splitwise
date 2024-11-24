from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import db, Expense, ExpenseSplit, Group, User
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

# Create expenses blueprint
expenses = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses.route('/group/<int:group_id>', methods=['POST'])
@login_required
def add_expense(group_id):
    try:
        # Get group and verify membership
        group = Group.query.get_or_404(group_id)
        if current_user not in group.members:
            return jsonify({'error': 'You are not a member of this group'}), 403

        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        description = data.get('description')
        amount = data.get('amount')
        split_with = data.get('split_with', [])

        if not description or not isinstance(description, str):
            return jsonify({'error': 'Description is required'}), 400

        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'error': 'Amount must be greater than 0'}), 400
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid amount'}), 400

        if not split_with or not isinstance(split_with, list):
            return jsonify({'error': 'At least one member must be selected for splitting'}), 400

        # Create expense
        expense = Expense(
            description=description,
            amount=amount,
            currency=group.currency,
            payer_id=current_user.id,
            group_id=group_id,
            date=datetime.utcnow()
        )
        db.session.add(expense)
        db.session.flush()  # Get the expense ID without committing

        # Calculate split amount based only on selected members
        total_members = len(split_with)  # Don't include payer in count
        if total_members == 0:
            db.session.rollback()
            return jsonify({'error': 'At least one member must be selected for splitting'}), 400

        split_amount = round(amount / total_members, 2)

        # Create splits only for selected members
        for member_id in split_with:
            # Verify member exists and is in the group
            member = User.query.get(member_id)
            if not member or member not in group.members:
                db.session.rollback()
                return jsonify({'error': f'Invalid member ID: {member_id}'}), 400

            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=member_id,
                amount=split_amount,
                is_settled=False
            )
            db.session.add(split)

        # Commit all changes
        db.session.commit()

        return jsonify({
            'message': 'Expense created successfully',
            'expense': {
                'id': expense.id,
                'description': expense.description,
                'amount': expense.amount,
                'currency': expense.currency,
                'date': expense.date.isoformat(),
                'splits': [{
                    'user_id': split.user_id,
                    'amount': split.amount,
                    'is_settled': split.is_settled
                } for split in expense.splits]
            }
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses.route('/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    try:
        expense = Expense.query.get_or_404(expense_id)
        group = expense.group
        
        # Only allow expense creator or group admin to delete
        if current_user.id != expense.payer_id and current_user.id != group.created_by_id:
            return jsonify({
                'status': 'error',
                'message': 'You are not authorized to delete this expense.',
                'data': None
            }), 403
        
        # Store group_id before deleting the expense
        group_id = expense.group_id
        
        # Delete all splits associated with the expense
        ExpenseSplit.query.filter_by(expense_id=expense_id).delete()
        
        # Delete the expense
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Expense has been deleted.',
            'data': None
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Database error occurred',
            'data': None
        }), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e),
            'data': None
        }), 500

@expenses.route('/<int:expense_id>/settle', methods=['POST'])
@login_required
def settle_expense(expense_id):
    try:
        validate_csrf(request.form.get('csrf_token'))
    except:
        flash('Invalid CSRF token. Please try again.', 'danger')
        return redirect(url_for('main.dashboard'))

    expense = Expense.query.get_or_404(expense_id)
    
    # Don't allow payer to settle their own expense
    if current_user.id == expense.payer_id:
        flash('You cannot settle an expense you paid for.', 'danger')
        return redirect(url_for('groups.view_group', group_id=expense.group_id))
    
    # Check if user is in the splits
    user_split = None
    for split in expense.splits:
        if split.user_id == current_user.id:
            user_split = split
            break
    
    if not user_split:
        flash('You are not involved in this expense.', 'danger')
        return redirect(url_for('groups.view_group', group_id=expense.group_id))
    
    # Calculate the amount this user owes for this expense
    split_amount = expense.amount / len(expense.splits)
    
    # Get current balances
    group = expense.group
    payer_balance = group.get_user_balance(expense.payer_id)
    user_balance = group.get_user_balance(current_user.id)
    
    # Mark expense as settled
    expense.is_settled = True
    
    # Update balances
    user_split.is_settled = True
    user_split.settled_at = datetime.utcnow()
    
    db.session.commit()
    
    # Show success message with amount settled
    flash(f'You settled {expense.get_currency_symbol()}{split_amount:.2f} with {expense.payer.username}!', 'success')
    return redirect(url_for('groups.view_group', group_id=expense.group_id))

@expenses.route('/<int:expense_id>', methods=['GET'])
@login_required
def view_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    
    # Check if user is member of the group
    if current_user not in expense.group.members:
        flash('You are not authorized to view this expense.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    return render_template('view_expense.html', expense=expense)

@expenses.route('/<int:expense_id>/splits', methods=['PUT'])
@login_required
def update_splits(expense_id):
    try:
        validate_csrf(request.form.get('csrf_token'))
    except:
        flash('Invalid CSRF token. Please try again.', 'danger')
        return redirect(url_for('main.dashboard'))

    expense = Expense.query.get_or_404(expense_id)
    
    # Check if user is the payer
    if expense.payer_id != current_user.id:
        flash('You can only edit splits for expenses you paid for.', 'danger')
        return redirect(url_for('expenses.view_expense', expense_id=expense_id))
    
    # Get selected member IDs
    member_ids = request.form.getlist('member_ids[]')
    if not member_ids:
        flash('Please select at least one member to split the expense with.', 'danger')
        return redirect(url_for('expenses.view_expense', expense_id=expense_id))
    
    try:
        # Convert to integers and validate members
        member_ids = [int(id) for id in member_ids]
        group_member_ids = [member.id for member in expense.group.members]
        for member_id in member_ids:
            if member_id not in group_member_ids:
                flash('Invalid member selected.', 'danger')
                return redirect(url_for('expenses.view_expense', expense_id=expense_id))
        
        # Calculate split amount
        split_amount = expense.amount / len(member_ids)
        
        # Delete existing splits
        ExpenseSplit.query.filter_by(expense_id=expense_id).delete()
        
        # Create new splits
        for member_id in member_ids:
            split = ExpenseSplit(
                expense_id=expense_id,
                user_id=member_id,
                amount=split_amount
            )
            db.session.add(split)
        
        db.session.commit()
        flash('Expense splits updated successfully.', 'success')
        
    except (ValueError, ZeroDivisionError):
        db.session.rollback()
        flash('An error occurred while updating splits.', 'danger')
    
    return redirect(url_for('expenses.view_expense', expense_id=expense_id))
