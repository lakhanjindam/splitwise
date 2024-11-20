from flask import Blueprint, render_template
from flask_login import login_required, current_user
from .models import Group, Expense, ExpenseSplit

# Create main blueprint
main = Blueprint('main', __name__)

@main.route('/')
@login_required
def index():
    return render_template('index.html')

@main.route('/dashboard')
@login_required
def dashboard():
    # Get user's groups
    user_groups = current_user.groups
    
    # Get all balances with other users
    user_balances = current_user.get_all_balances()
    
    # Calculate group balances
    group_balances = []
    for group in user_groups:
        balance = current_user.get_group_balance(group)
        if balance != 0:  # Only include non-zero balances
            group_balances.append({
                'group': group,
                'balance': balance
            })
    
    # Get recent expenses
    recent_expenses = Expense.query\
        .join(ExpenseSplit)\
        .filter((Expense.payer_id == current_user.id) | 
                (ExpenseSplit.user_id == current_user.id))\
        .order_by(Expense.date.desc())\
        .limit(5)\
        .all()
    
    return render_template('dashboard.html',
                         user_balances=user_balances,
                         group_balances=group_balances,
                         groups=user_groups,
                         recent_expenses=recent_expenses)
