"""Add proper foreign key constraints to ExpenseSplit

Revision ID: 52a3afbf544c
Revises: 29d73c69ed46
Create Date: 2024-11-16 13:24:41.272340

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '52a3afbf544c'
down_revision = '29d73c69ed46'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('expense_split', schema=None) as batch_op:
        batch_op.drop_constraint('fk_expensesplit_expense_id', type_='foreignkey')
        batch_op.drop_constraint('fk_expensesplit_user_id', type_='foreignkey')
        batch_op.create_foreign_key('fk_expensesplit_expense_id', 'expense', ['expense_id'], ['id'], ondelete='CASCADE')
        batch_op.create_foreign_key('fk_expensesplit_user_id', 'user', ['user_id'], ['id'], ondelete='CASCADE')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('expense_split', schema=None) as batch_op:
        batch_op.drop_constraint('fk_expensesplit_user_id', type_='foreignkey')
        batch_op.drop_constraint('fk_expensesplit_expense_id', type_='foreignkey')
        batch_op.create_foreign_key('fk_expensesplit_user_id', 'user', ['user_id'], ['id'])
        batch_op.create_foreign_key('fk_expensesplit_expense_id', 'expense', ['expense_id'], ['id'])

    # ### end Alembic commands ###
