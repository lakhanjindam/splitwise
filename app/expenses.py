from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from .models import db, Expense, ExpenseSplit, Group, User
from datetime import datetime
from flask_wtf.csrf import validate_csrf

expenses = Blueprint('expenses', __name__)

@expenses.route('/group/<int:group_id>/add_expense', methods=['GET', 'POST'])
@login_required
def add_expense(group_id):
    group = Group.query.get_or_404(group_id)
    
    # Check if user is member of the group
    if current_user not in group.members:
        flash('You are not a member of this group.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        try:
            description = request.form.get('description')
            amount = float(request.form.get('amount'))
            
            # Create new expense with group's currency
            expense = Expense(
                description=description,
                amount=amount,
                currency=group.currency,  # Use group's currency
                payer_id=current_user.id,
                group_id=group.id
            )
            db.session.add(expense)
            
            # Get selected members for split
            selected_members = request.form.getlist('split_with')
            if not selected_members:
                flash('Please select at least one member to split with.', 'danger')
                return redirect(url_for('expenses.add_expense', group_id=group_id))
            
            # Always include the payer in the split
            if str(current_user.id) not in selected_members:
                selected_members.append(str(current_user.id))
            
            # Calculate split amount
            split_amount = amount / len(selected_members)
            
            # Create splits
            for member_id in selected_members:
                member = User.query.get(member_id)
                if member in group.members:  # Verify member is in group
                    split = ExpenseSplit(
                        expense=expense,
                        user_id=member_id,
                        amount=split_amount
                    )
                    db.session.add(split)
            
            db.session.commit()
            flash('Expense added successfully!', 'success')
            return redirect(url_for('groups.view_group', group_id=group_id))
            
        except (ValueError, ZeroDivisionError):
            flash('Invalid amount or no members selected.', 'danger')
            return redirect(url_for('expenses.add_expense', group_id=group_id))
    
    return render_template('add_expense.html', group=group)

@expenses.route('/expense/<int:expense_id>/delete', methods=['POST'])
@login_required
def delete_expense(expense_id):
    try:
        validate_csrf(request.form.get('csrf_token'))
    except:
        flash('Invalid CSRF token. Please try again.', 'danger')
        return redirect(url_for('main.dashboard'))

    expense = Expense.query.get_or_404(expense_id)
    group = expense.group
    
    # Only allow expense creator or group admin to delete
    if current_user.id != expense.payer_id and current_user.id != group.created_by_id:
        flash('You are not authorized to delete this expense.', 'danger')
        return redirect(url_for('groups.view_group', group_id=group.id))
    
    # Store group_id before deleting the expense
    group_id = expense.group_id
    
    # Delete all splits associated with the expense
    ExpenseSplit.query.filter_by(expense_id=expense_id).delete()
    
    # Delete the expense
    db.session.delete(expense)
    db.session.commit()
    
    flash('Expense has been deleted.', 'success')
    return redirect(url_for('groups.view_group', group_id=group_id))

@expenses.route('/expense/<int:expense_id>/settle', methods=['POST'])
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

@expenses.route('/expense/view/<int:expense_id>')
@login_required
def view_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    
    # Check if user is member of the group
    if current_user not in expense.group.members:
        flash('You are not authorized to view this expense.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    return render_template('view_expense.html', expense=expense)

@expenses.route('/expense/<int:expense_id>/update-splits', methods=['POST'])
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
