"""add currency field to group model

Revision ID: d02e570bb93c
Revises: 52a3afbf544c
Create Date: 2024-11-18 23:29:14.557716

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision = 'd02e570bb93c'
down_revision = '52a3afbf544c'
branch_labels = None
depends_on = None


def upgrade():
    # Create a temporary table object
    group_table = table('group',
        column('currency', sa.String(length=3))
    )
    
    # Add the column as nullable first
    with op.batch_alter_table('group', schema=None) as batch_op:
        batch_op.add_column(sa.Column('currency', sa.String(length=3), nullable=True))
    
    # Update existing rows with default value
    op.execute(
        group_table.update().values({'currency': 'USD'})
    )
    
    # Now make it not nullable
    with op.batch_alter_table('group', schema=None) as batch_op:
        batch_op.alter_column('currency',
                            existing_type=sa.String(length=3),
                            nullable=False)


def downgrade():
    with op.batch_alter_table('group', schema=None) as batch_op:
        batch_op.drop_column('currency')
