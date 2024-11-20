from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from sqlalchemy import func
from .extensions import db

# Define the many-to-many relationship table for group members
group_members = db.Table('group_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', name='fk_group_members_user_id'), primary_key=True),
    db.Column('group_id', db.Integer, db.ForeignKey('group.id', name='fk_group_members_group_id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    
    # Groups created by this user
    created_groups = db.relationship('Group', backref='creator', lazy=True, foreign_keys='Group.created_by_id')
    
    # Groups this user is a member of (many-to-many)
    groups = db.relationship('Group', 
                           secondary=group_members,
                           lazy='subquery',
                           backref=db.backref('members', lazy=True))
    
    # Expenses paid by this user
    expenses = db.relationship('Expense', backref='payer', lazy=True, foreign_keys='Expense.payer_id')
    
    # Expense splits this user is involved in
    expense_splits = db.relationship('ExpenseSplit', backref='user', lazy=True)

    __table_args__ = (
        db.UniqueConstraint('username', name='uq_user_username'),
        db.UniqueConstraint('email', name='uq_user_email'),
    )
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_balance_with_user(self, other_user):
        """Calculate the balance between this user and another user"""
        # Money this user paid that other_user owes
        money_owed_to_me = db.session.query(func.sum(ExpenseSplit.amount)).join(Expense)\
            .filter(Expense.payer_id == self.id)\
            .filter(ExpenseSplit.user_id == other_user.id)\
            .scalar() or 0

        # Money other_user paid that this user owes
        money_i_owe = db.session.query(func.sum(ExpenseSplit.amount)).join(Expense)\
            .filter(Expense.payer_id == other_user.id)\
            .filter(ExpenseSplit.user_id == self.id)\
            .scalar() or 0

        return money_owed_to_me - money_i_owe

    def get_all_balances(self):
        """Get balances with all users"""
        balances = []
        # Get all users this user has transactions with, along with their groups
        related_users = db.session.query(User, Group).distinct()\
            .join(ExpenseSplit, ExpenseSplit.user_id == User.id)\
            .join(Expense, ExpenseSplit.expense_id == Expense.id)\
            .join(Group, Expense.group_id == Group.id)\
            .filter(
                db.or_(
                    Expense.payer_id == self.id,
                    db.and_(
                        ExpenseSplit.user_id != self.id,
                        Expense.payer_id == ExpenseSplit.user_id
                    )
                )
            )\
            .filter(User.id != self.id)\
            .all()

        # Group the results by user and calculate balance for each group
        user_group_balances = {}
        for user, group in related_users:
            if user.id not in user_group_balances:
                user_group_balances[user.id] = []
            
            # Calculate balance for this user in this group
            balance = self.get_balance_with_user_in_group(user, group)
            if balance != 0:  # Only include non-zero balances
                user_group_balances[user.id].append({
                    'group': group,
                    'balance': balance
                })

        # Create the final balance list
        for user_id, group_balances in user_group_balances.items():
            user = User.query.get(user_id)
            for group_balance in group_balances:
                balances.append({
                    'user': user,
                    'group': group_balance['group'],
                    'balance': group_balance['balance']
                })
        
        return balances

    def get_balance_with_user_in_group(self, other_user, group):
        """Calculate the balance between this user and another user within a specific group"""
        # Money this user paid that other_user owes in this group
        money_owed_to_me = db.session.query(func.sum(ExpenseSplit.amount)).join(Expense)\
            .filter(Expense.payer_id == self.id)\
            .filter(ExpenseSplit.user_id == other_user.id)\
            .filter(Expense.group_id == group.id)\
            .scalar() or 0

        # Money other_user paid that this user owes in this group
        money_i_owe = db.session.query(func.sum(ExpenseSplit.amount)).join(Expense)\
            .filter(Expense.payer_id == other_user.id)\
            .filter(ExpenseSplit.user_id == self.id)\
            .filter(Expense.group_id == group.id)\
            .scalar() or 0

        return money_owed_to_me - money_i_owe

    def get_group_balance(self, group):
        """Calculate the user's balance within a specific group"""
        # Money this user paid in group expenses
        paid_in_group = db.session.query(func.sum(Expense.amount))\
            .filter(Expense.payer_id == self.id)\
            .filter(Expense.group_id == group.id)\
            .scalar() or 0

        # Money this user owes in group expenses
        owed_in_group = db.session.query(func.sum(ExpenseSplit.amount))\
            .join(Expense)\
            .filter(ExpenseSplit.user_id == self.id)\
            .filter(Expense.group_id == group.id)\
            .scalar() or 0

        return paid_in_group - owed_in_group

    def __repr__(self):
        return f'<User {self.username}>'

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(256))
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_group_creator_id'), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    
    # Group expenses (one-to-many)
    expenses = db.relationship('Expense',
                             backref=db.backref('group', lazy=True),
                             cascade='all, delete-orphan')
    
    # Note: 'members' relationship is defined through backref in User.groups
    # Note: 'creator' relationship is defined through backref in User.created_groups

    def get_recent_expenses(self, limit=5):
        """Get recent expenses for this group"""
        return Expense.query.filter_by(group_id=self.id)\
                          .order_by(Expense.date.desc())\
                          .limit(limit)\
                          .all()

    def get_total_expenses(self):
        """Get total amount of expenses in this group"""
        return db.session.query(func.sum(Expense.amount))\
                        .filter(Expense.group_id == self.id)\
                        .scalar() or 0

    def get_member_count(self):
        """Get number of members in this group"""
        return db.session.query(group_members)\
                        .filter_by(group_id=self.id)\
                        .count()

    def get_member_balances(self):
        """Calculate the current balance for each member in the group"""
        balances = {}
        # Initialize balances for all members
        for member in self.members:
            balances[member.id] = {
                'user': member,
                'owes': 0.0,  # Amount they owe to others
                'owed': 0.0,  # Amount others owe them
                'details': {}  # Detailed breakdown of who owes whom
            }
            # Initialize details for each other member
            for other_member in self.members:
                if other_member.id != member.id:
                    balances[member.id]['details'][other_member.id] = 0.0

        # Calculate balances from all expenses
        for expense in self.expenses:
            payer_id = expense.payer_id
            # Split amount equally among all members (including payer)
            num_splits = len(expense.splits)
            
            if num_splits == 0:
                continue
                
            split_amount = expense.amount / num_splits
            
            # For each split, calculate the balance changes
            for split in expense.splits:
                user_id = split.user_id
                
                if user_id == payer_id:
                    # Skip adding to owes/owed for payer's own share
                    continue
                
                # Only add to balances if not settled
                if not split.is_settled:
                    # Add to what this person owes
                    balances[user_id]['owes'] += split_amount
                    # Add to what payer is owed
                    balances[payer_id]['owed'] += split_amount
                    
                    # Update the detailed breakdown
                    balances[user_id]['details'][payer_id] -= split_amount  # User owes payer
                    balances[payer_id]['details'][user_id] += split_amount  # Payer is owed by user

        return balances

    def get_user_balance(self, user_id):
        """Get balance summary for a specific user in the group"""
        balances = self.get_member_balances()
        return balances.get(user_id, {
            'user': User.query.get(user_id),
            'owes': 0.0,
            'owed': 0.0,
            'details': {}
        })

    def get_currency_symbol(self):
        """Return the currency symbol based on currency code"""
        currency_symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'JPY': '¥'
        }
        return currency_symbols.get(self.currency, self.currency)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    payer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    
    # Relationships
    splits = db.relationship('ExpenseSplit', back_populates='expense', cascade='all, delete-orphan')

    def get_currency_symbol(self):
        """Return the currency symbol based on currency code"""
        symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'JPY': '¥'
        }
        return symbols.get(self.currency, self.currency)

class ExpenseSplit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey('expense.id', name='fk_expensesplit_expense_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_expensesplit_user_id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    is_settled = db.Column(db.Boolean, default=False)
    settled_at = db.Column(db.DateTime)

    # Relationships
    expense = db.relationship('Expense', back_populates='splits')
    # user relationship is handled by backref in User.expense_splits

    __table_args__ = (
        db.ForeignKeyConstraint(
            ['expense_id'], ['expense.id'],
            name='fk_expensesplit_expense_id',
            ondelete='CASCADE'
        ),
        db.ForeignKeyConstraint(
            ['user_id'], ['user.id'],
            name='fk_expensesplit_user_id',
            ondelete='CASCADE'
        ),
    )

    def __repr__(self):
        return f'<ExpenseSplit {self.id} User:{self.user_id} Amount:{self.amount}>'

    def settle(self):
        """Mark this split as settled"""
        self.is_settled = True
        self.settled_at = datetime.utcnow()
        db.session.commit()

    def unsettled(self):
        """Mark this split as unsettled"""
        self.is_settled = False
        self.settled_at = None
        db.session.commit()